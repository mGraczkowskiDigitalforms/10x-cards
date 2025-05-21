import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { FlashcardCreateDto, FlashcardDto } from "../../types";

export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

export class FlashcardService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * Creates multiple flashcards in a single transaction
   * @param flashcards Array of flashcard data to create
   * @param userId The ID of the user creating the flashcards
   * @returns Array of created flashcards
   * @throws {FlashcardServiceError} When flashcard creation fails
   */
  async createFlashcards(flashcards: FlashcardCreateDto[], userId: string): Promise<FlashcardDto[]> {
    try {
      // Check for duplicates within the batch
      const duplicates = this.findDuplicatesInBatch(flashcards);
      if (duplicates.length > 0) {
        throw new FlashcardServiceError("Duplicate flashcards found in the request", "DUPLICATE_FLASHCARDS", {
          duplicates,
        });
      }

      // Check for existing flashcards
      const existingFlashcards = await this.findExistingFlashcards(flashcards, userId);
      if (existingFlashcards.length > 0) {
        throw new FlashcardServiceError("Some flashcards already exist for this user", "EXISTING_FLASHCARDS", {
          existing: existingFlashcards,
        });
      }

      // Validate generation_ids if present
      const generationIds = flashcards.filter((f) => f.generation_id !== null).map((f) => f.generation_id!);

      if (generationIds.length > 0) {
        const invalidGenerationIds = await this.findInvalidGenerationIds(generationIds, userId);
        if (invalidGenerationIds.length > 0) {
          throw new FlashcardServiceError(
            "Some generation IDs are invalid or do not belong to the user",
            "INVALID_GENERATION_IDS",
            { invalidGenerationIds }
          );
        }
      }

      const { data, error } = await this.supabaseClient
        .from("flashcards")
        .insert(
          flashcards.map((flashcard) => ({
            ...flashcard,
            user_id: userId,
          }))
        )
        .select();

      if (error) {
        throw new FlashcardServiceError("Database error while creating flashcards", "DATABASE_ERROR", error);
      }

      if (!data || data.length === 0) {
        throw new FlashcardServiceError("No flashcards were created", "NO_FLASHCARDS_CREATED");
      }

      return data.map((flashcard) => ({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
      }));
    } catch (error) {
      if (error instanceof FlashcardServiceError) {
        throw error;
      }
      throw new FlashcardServiceError("Unexpected error while creating flashcards", "UNEXPECTED_ERROR", error);
    }
  }

  /**
   * Finds duplicate flashcards within the batch being created
   * @param flashcards Array of flashcards to check
   * @returns Array of duplicate flashcards
   */
  private findDuplicatesInBatch(flashcards: FlashcardCreateDto[]): FlashcardCreateDto[] {
    const seen = new Set<string>();
    const duplicates: FlashcardCreateDto[] = [];

    flashcards.forEach((flashcard) => {
      const key = `${flashcard.front}:${flashcard.back}`.toLowerCase();
      if (seen.has(key)) {
        duplicates.push(flashcard);
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  }

  /**
   * Checks if any of the flashcards already exist for the user
   * @param flashcards Array of flashcards to check
   * @param userId User ID to check against
   * @returns Array of existing flashcards
   */
  private async findExistingFlashcards(flashcards: FlashcardCreateDto[], userId: string): Promise<FlashcardDto[]> {
    const frontValues = flashcards.map((f) => f.front.toLowerCase());
    const backValues = flashcards.map((f) => f.back.toLowerCase());

    const { data, error } = await this.supabaseClient
      .from("flashcards")
      .select()
      .eq("user_id", userId)
      .or(`front.in.(${frontValues}),back.in.(${backValues})`);

    if (error) {
      throw new FlashcardServiceError("Error checking for existing flashcards", "DATABASE_ERROR", error);
    }

    return data || [];
  }

  /**
   * Validates that all generation IDs exist and belong to the user
   * @param generationIds Array of generation IDs to validate
   * @param userId User ID to check against
   * @returns Array of invalid generation IDs
   */
  private async findInvalidGenerationIds(generationIds: number[], userId: string): Promise<number[]> {
    const { data, error } = await this.supabaseClient
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .in("id", generationIds);

    if (error) {
      throw new FlashcardServiceError("Error validating generation IDs", "DATABASE_ERROR", error);
    }

    const foundIds = new Set(data?.map((g) => g.id) || []);
    return generationIds.filter((id) => !foundIds.has(id));
  }
}
