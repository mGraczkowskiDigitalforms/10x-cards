# OpenRouter Service Implementation Plan

## 1. Opis usługi
Usługa OpenRouter została zaprojektowana, aby integrować się z API OpenRouter w celu rozszerzenia funkcjonalności aplikacji czatu opartych na dużych modelach językowych (LLM). Umożliwia przesyłanie odpowiednio sformatowanych zapytań oraz odbiór odpowiedzi według określonego schematu. Usługa wykorzystuje technologie Astro 5, React 19, TypeScript 5, Tailwind 4 oraz Shadcn/ui, zgodnie z ustalonymi wytycznymi architektonicznymi oraz zasadami implementacji.

## 2. Opis konstruktora
Konstruktor (lub builder) odpowiada za:
1. Inicjalizację danych uwierzytelniających API (np. klucz API, URL endpointu) w sposób bezpieczny, przy wykorzystaniu zmiennych środowiskowych.
2. Konfigurację ustawień modelu, w tym domyślnej nazwy modelu oraz parametrów.
3. Konfigurację modułów wewnętrznych, takich jak przetwarzanie komunikatów, parsowanie odpowiedzi oraz obsługa błędów.
4. Załadowanie niezbędnych konfiguracji środowiskowych potrzebnych do działania usługi.

## 3. Publiczne metody i pola

Główne elementy interfejsu publicznego:

- **sendChatMessage(userMessage: string): Promise<ResponseType>**
  - Wysyła komunikat użytkownika do API, uwzględniając wcześniej ustawiony komunikat systemowy oraz konfigurację modelu.

- **setSystemMessage(message: string): void**
  - Umożliwia ustawienie komunikatu systemowego.

- **setUserMessage(message: string): void**
  - Umożliwia ustawienie komunikatu użytkownika.

- **setResponseFormat(schema: JSONSchema): void**
  - Konfiguruje schemat JSON dla strukturalnych odpowiedzi (response_format).

- **setModel(name: string, parameters: ModelParameters): void**
  - Pozwala na wybór modelu (model-name) oraz ustawienie jego parametrów (np. temperature, top_p, frequency_penalty, presence_penalty).

_Publiczne pola konfiguracyjne mogą obejmować:_
- `apiUrl`: URL API OpenRouter.
- `apiKey`: Bezpiecznie przechowywany klucz API.
- `defaultSettings`: Domyślne ustawienia modelu.

## 4. Prywatne metody i pola
1. **_preparePayload(messages: ChatMessage[]): Payload**
   Formatuje wiadomości wejściowe do postaci payload, łącząc komunikaty systemowe, użytkownika oraz uporządkowane odpowiedzi według schematu. Integruje `response_format` do przygotowywanego payload, zgodnie z poniższą specyfikacją.
2. **_sendRequest(payload: Payload): Promise<Response>**
   Obsługuje wysyłanie żądania do API OpenRouter z zastosowaniem logiki ponownych prób.
3. **_validateResponse(response: any): ValidatedResponse**
   Weryfikuje, czy odpowiedź z API spełnia oczekiwany schemat JSON określony w `response_format`.
4. **_logError(error: Error): void**
   Mechanizm wewnętrznego logowania, który rejestruje szczegóły błędów w celu monitorowania i debugowania.

## 5. Obsługa błędów
Potencjalne scenariusze błędów obejmują:
1. **Błędy sieciowe:** Problemy z czasem oczekiwania lub niedostępność endpointu API.
2. **Błędy uwierzytelniania:** Nieprawidłowy lub wygasły klucz API.
3. **Błędy formatu odpowiedzi:** Brak wymaganych pól lub niezgodność z oczekiwanym schematem.
4. **Ograniczenie przepustowości (Rate Limiting):** Ograniczenia wynikające z nadmiernej liczby zapytań.
5. **Nieoczekiwane kody statusów:** Odpowiedzi, które nie spełniają warunków sukcesu.

_Proponowane rozwiązania dla powyższych wyzwań:_
1. Zaimplementować ponowne próby (retries) z wykorzystaniem wykładniczego opóźnienia w przypadku błędów sieciowych.
2. Walidować dane uwierzytelniające API przy starcie usługi oraz przed wysłaniem żądania.
3. Wykorzystywać walidację schematu JSON, aby upewnić się, że otrzymana odpowiedź spełnia oczekiwania.
4. Rzucać opisowe komunikaty błędów i rejestrować szczegółowe informacje dla dalszej analizy.
5. Dostarczyć użytkownikowi przyjazne komunikaty o błędach oraz mechanizmy awaryjne, gdy to konieczne.

## 6. Kwestie bezpieczeństwa
1. Przechowywać klucze API w zmiennych środowiskowych, unikając ich twardego kodowania.
2. Rejestrować błędy z odpowiednim kontekstem, ale bez ujawniania wrażliwych informacji.

## 7. Plan wdrożenia krok po kroku
1. **Konfiguracja środowiska:**
   - Skonfiguruj zmienne środowiskowe zawierające klucz API oraz endpoint.
   - Przygotuj środowisko projektu, wykorzystując Astro 5, React 19, TypeScript 5, Tailwind 4 oraz Shadcn/ui.

2. **Rozwój modułu API Client:**
   - Utwórz moduły do przygotowywania payloadów (`_preparePayload`), wysyłania żądań (`_sendRequest`) oraz walidacji odpowiedzi (`_validateResponse`).
   - Zintegruj endpoint API OpenRouter, dbając o bezpieczne przetwarzanie klucza API.

3. **Implementacja przetwarzania komunikatów:**
   - Zaprojektuj obsługę różnych typów komunikatów:
     1. **Komunikat systemowy:** np. "You are a knowledgeable assistant designed to support users in various tasks."  
        (Komunikat o wysokim priorytecie, pozostaje w języku angielskim zgodnie z wymaganiami integracji API)
     2. **Komunikat użytkownika:** np. "How do I set up my API key?"  
        (Komunikat wejściowy użytkownika pozostaje w języku angielskim dla zapewnienia zgodności z API)
   - Upewnij się, że komunikaty są odpowiednio sformatowane i zawarte w payload.

4. **Definicja formatu odpowiedzi (response_format):**
   - Zaimplementuj `response_format` jako uporządkowaną odpowiedź w formacie JSON. Przykład:
     ```json
     { "type": "json_schema", "json_schema": { "name": "chatResponse", "strict": true, "schema": { "message": "string", "status": "number" } } }
     ```

5. **Konfiguracja ustawień modelu:**
   - Umożliw konfigurację nazwy modelu (np. "gpt-4-mini") oraz parametrów modelu, takich jak temperature (np. 0.7), max_tokens itp.

6. **Implementacja obsługi błędów:**
   - Zaimplementuj mechanizmy obsługi błędów zgodnie z opisanymi wyżej scenariuszami.
   - Włącz mechanizmy ponownych prób (retries), walidację schematu JSON oraz szczegółowe logowanie błędów.

## Additional Considerations for OpenRouter API Integration
1. **System Message:**
   - Ustaw komunikat systemowy o wysokim priorytecie, np.: "You are ChatGPT, a helpful and knowledgeable assistant trained on diverse topics."
2. **User Message:**
   - Określ precyzyjnie komunikat wejściowy, np.: "Please provide guidance on API integration."
3. **Response Format (response_format):**
   - Zdefiniuj odpowiedź API korzystającą ze schematu JSON, np.:
     { "type": "json_schema", "json_schema": { "name": "chatResponse", "strict": true, "schema": { "message": "string", "status": "number" } } }
4. **Model Name:**
   - Określ nazwę modelu bezpośrednio w konfiguracji (np. "gpt-4-mini").
5. **Model Parameters:**
   - Skonfiguruj parametry, takie jak temperature, max_tokens oraz sekwencje zatrzymania (stop sequences), np.: { "temperature": 0.7, "max_tokens": 150 }.

Całościowy plan zapewnia, że usługa jest implementowana zgodnie z naszym stosem technologicznym, przestrzega najlepszych praktyk obsługi błędów oraz bezpieczeństwa, a także spełnia wymagania API OpenRouter. 