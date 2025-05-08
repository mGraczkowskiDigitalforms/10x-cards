# Plan wdrożenia endpointa API: POST /flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy odpowiada za tworzenie jednej lub wielu fiszek. Fiszki mogą być tworzone ręcznie przez użytkownika lub generowane automatycznie przez system AI. Endpoint zapewnia odpowiednią walidację danych wejściowych oraz bezpieczne wstawienie danych fiszki do bazy danych, wiążąc każdą fiszkę z uwierzytelnionym użytkownikiem.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /flashcards (lub /api/flashcards zgodnie z konwencjami Astro)
- **Parametry:**
  - **Wymagane:**
    - `front`: string, wymagany, długość od 1 do 200 znaków.
    - `back`: string, wymagany, długość od 1 do 500 znaków.
    - `source`: string, wymagany, dozwolone wartości: 'ai-full', 'ai-edited', 'manual'.
    - Dane uwierzytelniające użytkownika (dostarczane przez sesję Supabase).
  - **Opcjonalne:**
    - `generation_id`: number, opcjonalny (ale wymagany, gdy `source` jest 'ai-full' lub 'ai-edited').
- **Przykład treści żądania:**
```json
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "source": "ai-full | ai-edited | manual",
      "generation_id": number | null
    }
  ]
}
```

## 3. Wykorzystywane typy
- **DTOs:**
  - `FlashcardDto`: obiekt transferu danych dla zwracanych danych fiszki.
- **Command Models:**
  - `FlashcardCreateDto`: typ wejściowy do tworzenia fiszki.
  - `CreateFlashcardsCommand`: polecenie zawierające tablicę fiszek do zbiorowego utworzenia.

## 4. Szczegóły odpowiedzi
- **Sukces (201 Created):**
```json
{
  "flashcards": [
    {
      "id": number,
      "front": "string",
      "back": "string",
      "source": "string",
      "generation_id": number,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "message": "Flashcards creation completed"
}
```
- **Odpowiedzi błędów:**
  - **400 Bad Request:** Przy błędach walidacji (np. nieprawidłowa długość `front` lub `back`, błędna wartość `source`, brak `generation_id` gdy wymagany).
  - **401 Unauthorized:** Jeśli użytkownik nie jest uwierzytelniony.
  - **500 Internal Server Error:** W przypadku nieoczekiwanych błędów, takich jak problemy z łącznością z bazą danych.

## 5. Przepływ danych
1. Klient wysyła żądanie POST z danymi fiszek.
2. Endpoint weryfikuje, czy użytkownik jest zalogowany (autoryzacja JWT).
   - Jeśli nie → zwróć 401 Unauthorized
3. Walidacja wejściowa:
   - Sprawdzenie długości tekstu front i back.
   - Sprawdzenie poprawności wartości source.
   - Sprawdzenie obecności generation_id gdy wymagany.
   - Jeśli nie spełnia wymagań → zwróć 400 Bad Request
4. Zwalidowane dane są przekazywane do warstwy serwisowej (np. `flashcards.service`), która obsługuje interakcję z bazą danych.
5. Warstwa serwisowa wykonuje operację zbiorczego wstawienia danych do tabeli `flashcards` przy użyciu Supabase, z odpowiednim zarządzaniem transakcjami.
6. W przypadku sukcesu, zwracane są nowo utworzone fiszki oraz komunikat o powodzeniu.
7. W razie błędów, wyjątek jest przechwytywany, logowany (jeśli to konieczne) i zwracana jest odpowiednia odpowiedź błędu.

## 6. Względy bezpieczeństwa
- Tylko uwierzytelnieni użytkownicy mają dostęp do tego punktu końcowego; nieautoryzowane żądania są odrzucane z kodem 401.
- Wymagana jest implementacja zasad RLS poprzez sprawdzenie, że `user_id` w bazie odpowiada identyfikatorowi uwierzytelnionego użytkownika.
- Walidacja danych wejściowych przy użyciu Zod, aby zapobiec wprowadzeniu nieprawidłowych danych oraz atakom SQL injection.
- Unikać ujawniania szczegółowych informacji o błędach w odpowiedzi, aby chronić wewnętrzne szczegóły systemu.

## 7. Obsługa błędów
- **400 Bad Request:** Wywoływany przy błędach walidacji, takich jak:
  - Puste lub zbyt długie wartości `front` lub `back`.
  - Nieprawidłowa wartość `source`.
  - Brak `generation_id`, gdy jest wymagany.
- **401 Unauthorized:** Zwracany, gdy użytkownik nie jest uwierzytelniony.
- **500 Internal Server Error:** W przypadku nieoczekiwanych błędów (np. problemy z łącznością z bazą danych), zlogować błąd i zwrócić ogólny komunikat błędu.

## 8. Rozważania dotyczące wydajności
- Zastosowanie zbiorczego wstawiania danych pozwala efektywnie przetwarzać wiele fiszek w jednym żądaniu.
- Wykorzystanie indeksów bazy danych na polach `user_id` i `generation_id` (zgodnie z planem bazy) usprawnia wydajność zapytań.
- Rozważenie wdrożenia mechanizmu rate limiting, aby zapobiec nadużyciom i zapewnić stabilność systemu.

## 9. Etapy wdrożenia
1. Utworzenie pliku endpointu (np. `src/pages/api/flashcards.ts`) obsługującego żądania POST.
2. Implementacja walidacji danych wejściowych przy użyciu Zod, zgodnie z wymaganiami specyfikacji API.
3. Wdrożenie mechanizmu autoryzacji, weryfikacja tokena JWT.
4. Opracowanie funkcji w warstwie serwisowej (np. `flashcardsService.service`) do zarządzania interakcją z bazą Supabase.
5. Implementacja logiki zbiorczego wstawiania danych fiszek do bazy danych.
6. Zapewnienie właściwej implementacji zasad RLS na poziomie bazy danych.
7. Wdrożenie kompleksowej obsługi błędów i mechanizmów logowania.
8. Przeprowadzenie przeglądu kodu.