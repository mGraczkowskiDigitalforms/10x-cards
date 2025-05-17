# API Endpoint Implementation Plan: POST /flashcards/generate

## 1. Przegląd punktu końcowego
Celem tego endpointa jest generowanie propozycji fiszek przez AI na podstawie podanego tekstu wejściowego. Endpoint przyjmuje tekst, waliduje jego długość, wywołuje zewnętrzny serwis LLM do wygenerowania propozycji, rejestruje zdarzenie generacji w bazie oraz tworzy powiązane propozycje fiszek z oznaczeniem "ai-full".

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /generations
- Parametry:
  - Wymagane:
    - `text` (string, długość od 1000 do 10000 znaków)
  - Opcjonalne: Brak
- Request Body:
  ```json
  {
    "text": "..."
  }
  ```

## 3. Wykorzystywane typy
- `GenerateFlashcardsCommand`: definiuje strukturę wejściową, zawierającą pole `text`.
- `GenerationDto`: minimalne informacje o zdarzeniu generacji (id, model, generated_count, created_at).
- `FlashcardProposalDto`: reprezentuje pojedynczą propozycję fiszki (front, back, source, generation_id).
- `GenerationCreateResponseDto`: struktura odpowiedzi, łącząca dane zdarzenia generacji oraz tablicę propozycji fiszek.

## 4. Szczegóły odpowiedzi
- Przykładowa odpowiedź w przypadku sukcesu (status 200/201):
  ```json
  {
    "generation": {
      "id": 1,
      "model": "gpt-4-mini",
      "generated_count": 5,
      "created_at": "2023-10-01T12:00:00Z"
    },
    "flashcards_proposal": [
      {
        "front": "Question text",
        "back": "Answer text",
        "source": "ai-full",
        "generation_id": 1
      }
    ]
  }
  ```
- Kody statusów:
  - 201 Created – w przypadku pomyślnego utworzenia zasobów.
  - 400 Bad Request – gdy walidacja tekstu nie powiedzie się.
  - 401 Unauthorized – gdy użytkownik nie jest uwierzytelniony.
  - 500 Internal Server Error – przy błędach wewnętrznych serwera.
  - 502 Bad Gateway – gdy wystąpi błąd komunikacji z zewnętrznym serwisem LLM.

## 5. Przepływ danych
1. Klient wysyła żądanie POST z obiektem zawierającym pole `text`.
2. Endpoint weryfikuje, czy użytkownik jest zalogowany (autoryzacja JWT).
   - Jeśli nie → zwróć 401 Unauthorized
3. Walidacja wejściowa:
   - Sprawdzenie długości tekstu (1000-10000 znaków).
   - Jeśli nie spełnia wymagań → zwróć 400 Bad Request
4. Wywołanie zewnętrznego serwisu LLM do generowania fiszek (np. `generation.service`).
   - Przekazujemy:
     - Tekst źródłowy (1000-10000 znaków)
     - Hash tekstu źródłowego (do wykrywania duplikatów)
   - Jeśli błąd połączenia → zapisz w `generation_error_logs` i zwróć 502 Bad Gateway
   - Jeśli timeout → zapisz w `generation_error_logs` i zwróć 504 Gateway Timeout
   - Jeśli błąd API → zapisz w `generation_error_logs` i zwróć 500 Internal Server Error
5. Otrzymanie wyników generacji:
   - Propozycje fiszek.
   - Jeśli nieprawidłowy format → zapisz w `generation_error_logs` i zwróć 500 Internal Server Error
6. Zapis zdarzenia generacji w bazie danych (tabela `generations`), powiązanego z użytkownikiem:
   - Zapisywane dane:
     - `user_id`: ID zalogowanego użytkownika
     - `model`: nazwa użytego modelu LLM
     - `generated_count`: liczba wygenerowanych fiszek
     - `source_text_hash`: hash tekstu źródłowego
     - `source_text_length`: długość tekstu źródłowego
     - `generation_duration`: czas trwania generacji w ms
     - `created_at`, `updated_at`: automatycznie ustawiane timestampy
   - Jeśli błąd bazy danych → zapisz w `generation_error_logs` i zwróć 500 Internal Server Error
7. Utworzenie propozycji fiszek w bazie lub przygotowanie ich do dalszej edycji, ustawiając źródło na `ai-full`.
   - Jeśli błąd bazy danych → zapisz w `generation_error_logs` i zwróć 500 Internal Server Error
8. Zwrócenie odpowiedzi klientowi:
   - Status 201 Created
   - Obiekt GenerationCreateResponseDto zawierający metadane generacji oraz tablicę propozycji fiszek

## 6. Względy bezpieczeństwa
- Endpoint musi być dostępny tylko dla uwierzytelnionych użytkowników (wymagany token JWT).
- Walidacja wejściowa po stronie serwera przy użyciu zod.
- Użycie mechanizmów RLS w bazie danych, aby użytkownik miał dostęp tylko do swoich rekordów.
- Bezpieczna obsługa wywołań zewnętrznego API (timeout, retries oraz logowanie błędów).

## 7. Obsługa błędów
- Walidacja danych wejściowych:
  - Jeśli `text` jest krótszy niż 1000 lub dłuższy niż 10000 znaków → Response 400.
- Błąd autoryzacji:
  - Brak lub nieprawidłowy token → Response 401.
- Błąd zewnętrznego serwisu:
  - Błąd wywołania API LLM → logowanie błędu w `generation_error_logs`, Response 502 lub 500.
- Inne błędy wewnętrzne:
  - Problemy z bazą danych lub logiką aplikacji → Response 500.

## 8. Rozważania dotyczące wydajności
- Asynchroniczne wywołanie zewnętrznego serwisu LLM może wpłynąć na czas odpowiedzi (timeout ustawiony na 60 sekund).
- Możliwość wykorzystania cache dla powtarzających się zapytań generacyjnych.
- Monitorowanie obciążenia oraz rate limiting endpointu w celu zapobiegania nadużyciom.

## 9. Etapy wdrożenia
1. Utworzenie nowego endpointa `POST /generations` w katalogu `src/pages/api`.
2. Implementacja walidacji danych wejściowych przy użyciu zod oraz sprawdzenie ograniczenia długości tekstu.
3. Wdrożenie mechanizmu autoryzacji, weryfikacja tokena JWT.
4. Integracja z zewnętrznym serwisem LLM:
   - Przygotowanie funkcji wywoławczej w module serwisowym (np. w `generation.service`).
   - Implementacja obsługi timeoutów oraz błędów połączeniowych.
5. Zapis zdarzenia generacji w bazie danych (tabela `generations`) wraz z powiązaniem użytkownika.
6. Utworzenie propozycji fiszek z oznaczeniem `ai-full` oraz powiązanie ich z utworzoną generacją.
7. Dodanie logiki zapisu błędów do tabeli `generation_error_logs` w przypadku nieudanej generacji.