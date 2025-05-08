# REST API Plan

## 1. Resources

- **Users**: Represents user accounts managed by the system (from the `users` table).
- **Flashcards**: Represents flashcards created manually or generated via AI (from the `flashcards` table).
- **Generations**: Represents AI flashcard generation events including metadata (from the `generations` table).
- **Generation Error Logs**: Stores logs for any failed AI generation attempts (from the `generation_error_logs` table).

## 2. Endpoints

### 2.1 Flashcards Endpoints

- **GET /flashcards**
  - **Description**: Retrieves a paginated list of flashcards for the authenticated user.
  - **Query Parameters**:
    - `page` (optional, default=1)
    - `limit` (optional, default=20)
    - `sort` (optional, e.g., `created_at`)
    - `order` (optional, e.g., `desc`, `asc`)
  - **Response JSON**:
    ```json
    {
      "flashcards": [
        {
          "id": "number",
          "front": "string",
          "back": "string",
          "source": "string",
          "generation_id": "number",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "pagination": {
        "page": "number",
        "limit": "number",
        "total": "number"
      }
    }
    ```
  - **Success Codes**: 200 OK
  - **Error Codes**: 401 Unauthorized

- **GET /flashcards/{id}**
  - **Description**: Retrieves details of a specific flashcard.
  - **URL Parameter**: `id` (flashcard ID)
  - **Response JSON**:
    ```json
    {
      "id": "number",
      "front": "string",
      "back": "string",
      "source": "string",
      "generation_id": "number",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found, 401 Unauthorized

- **POST /flashcards**
  - **Description**: Create one or more flashcards (manually or from AI generation).
  - **Request JSON**:
    ```json
    {
      "flashcards": [
        {
          "id": "number",
          "front": "string (max 200 chars)",
          "back": "string (max 500 chars)",
          "source": "string ('ai-full', 'ai-edited', or 'manual')",
          "generation_id": "number (optional)",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ]
    }
    ```
  - **Response JSON**:
    ```json
    {
      "flashcards": [
        {
          "id": "number",
          "front": "string",
          "back": "string",
          "source": "string",
          "generation_id": "number",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "message": "Flashcards creation completed"
    }
    ```
  - **Error Response JSON** (400 Bad Request):
    ```json
    {
      "error": {
        "message": "Validation failed",
        "details": [
          {
            "field": "front",
            "error": "Front text exceeds maximum length of 200 characters"
          }
        ]
      }
    }
    ```
  - **Success Codes**: 201 Created
  - **Error Codes**: 400 Bad Request, 401 Unauthorized
  - **Validations**:
    - `front`: Required, string, min length 1, max length 200
    - `back`: Required, string, min length 1, max length 500
    - `source`: Required, must be one of: 'ai-full', 'ai-edited', 'manual'
    - `generation_id`: Optional, must be a positive integer, required when source is 'ai-full' or 'ai-edited'

- **PUT /flashcards/{id}**
  - **Description**: Updates an existing flashcard.
  - **URL Parameter**: `id` (flashcard ID)
  - **Request JSON** (partial update allowed):
    ```json
    {
      "front": "string (max 200 chars)",
      "back": "string (max 500 chars)",
      "source": "string ('ai-edited' or 'manual')"
    }
    ```
  - **Response JSON**:
    ```json
    {
      "flashcard": {
        "id": "number",
        "front": "string",
        "back": "string",
        "source": "string",
        "generation_id": "number",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    ```
  - **Success Codes**: 200 OK
  - **Error Codes**: 400 Bad Request, 404 Not Found, 401 Unauthorized
  - **Validations**:
    - `front`: Optional, string, min length 1, max length 200
    - `back`: Optional, string, min length 1, max length 500
    - `source`: Optional, must be one of: 'ai-edited', 'manual' (cannot be 'ai-full')

- **DELETE /flashcards/{id}**
  - **Description**: Deletes a flashcard.
  - **URL Parameter**: `id` (flashcard ID)
  - **Response JSON**:
    ```json
    {
      "message": "Flashcard deleted successfully"
    }
    ```
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found, 401 Unauthorized

### 2.3 Flashcards Generation Endpoints

- **POST /generations**
  - **Description**: Generates flashcards proposals using AI based on provided text input.
  - **Request JSON**:
    ```json
    {
      "text": "string (1000 to 10000 characters)",
    }
    ```
  - **Process**:
    - Validate that the `text` length is within the allowed range (1000-10000 characters).
    - Call an external LLM API using the provided text to generate flashcards proposals.
    - Record a generation event with metadata such as `model`, `generation_duration`, and counts.
    - Create associated flashcards proposals with the source set to `'ai-full'`.
  - **Response JSON**:
    ```json
    {
      "generation": {
        "id": "number",
        "model": "string",
        "generated_count": "number",
        "created_at": "timestamp"
      },
      "flashcards_proposal": [
        {
          "front": "string",
          "back": "string",
          "source": "ai-full",
          "generation_id": "number"
        }
      ]
    }
    ```
  - **Success Codes**: 200 OK / 201 Created
  - **Error Codes**: 400 Bad Request, 500 Internal Server Error (AI Service Error - logged in generation error logs), 502 Bad Gateway (LLM API error - logged in generation error logs), 401 Unauthorized

### 2.4 Generations Endpoints

- **GET /generations**
  - **Description**: Retrieves a paginated list of AI generation events for the authenticated user.
  - **Query Parameters**: `page`, `limit`
  - **Response JSON**: Returns paginated list of generations.
  - **Success Codes**: 200 OK
  - **Error Codes**: 401 Unauthorized

- **GET /generations/{id}**
  - **Description**: Retrieves details of a specific generation event.
  - **URL Parameter**: `id` (generation event ID)
  - **Response JSON**: Returns generation details and associated flashcards.
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found, 401 Unauthorized

### 2.5 Generation Error Logs Endpoints

- **GET /generation-error-logs**
  - **Description**: Retrieves a list of generation error logs for the authenticated user.
  - **Response JSON**: List of error log objects.
  - **Success Codes**: 200 OK
  - **Error Codes**: 401 Unauthorized

## 3. Authentication and Authorization

- The API uses JWT-based authentication. All endpoints (except `/auth/register` and `/auth/login`) require an Authorization header with a Bearer token.
- The back-end enforces row-level security by ensuring that a user can only access their own flashcards, generation events, and error logs.
- Integration with Supabase Auth is recommended for seamless user management and secure access.

## 4. Validation and Business Logic

- **Validation Rules**:
  - **Flashcards**:
    - `front` must not exceed 200 characters.
    - `back` must not exceed 500 characters.
    - `source` must be one of: `'ai-full'`, `'ai-edited'`, or `'manual'`.
  - **Generations**:
    - The `source_text_length` must be between 1000 and 10000 characters.
    - The `source_text_hash` must be unique per user to prevent duplicate generations.

- **Business Logic**:
  - **User Management**: Handled via standard registration and login endpoints with secure password storage.
  - **AI Generation**:
    - Validates input text length before calling external LLM APIs.
    - Records generation metadata (model used, generation duration, counts) in the `generations` table.
    - Creates corresponding flashcards marked with the appropriate source tag.
    - Logs any API errors in the `generation_error_logs` table for troubleshooting.
  - **Flashcard Management**: Users can create, update, and delete flashcards. The API ensures that operations are permitted only on resources owned by the authenticated user.
  - **Pagination, Filtering, and Sorting**: Implemented on list endpoints to ensure performance and scalability.
  - **Security Measures**: Rate limiting, thorough input validation, and JWT-based authentication help secure the API against unauthorized access and abuse. 