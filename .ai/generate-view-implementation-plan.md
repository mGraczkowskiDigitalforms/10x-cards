/*
Plan implementacji widoku Generowanie fiszek
*/

# Plan implementacji widoku Generowanie fiszek

## 1. Przegląd
Widok umożliwia użytkownikowi wprowadzenie tekstu w zakresie 1000-10000 znaków, wysłanie go do API opartego na AI oraz otrzymanie propozycji fiszek do akceptacji, edycji lub odrzucenia. Widok zapewnia moliwość przeglądac, zatwierdzac, edytować i odrzucac wygenerowane propozycje fiszek, wskaźnik ładowania oraz komunikaty błędów. Na koniec moe zapisać do bazy danych wszystkie bądz tylko zaakceptowane fiszki.

## 2. Routing widoku
Ścieżka: `/generate`

## 3. Struktura komponentów
- **GenerateView** (kontener widoku) zawierajacy logike i strukture strony
  - **TextInputForm** – formularz tekstowy do wklejania tekstu
  - **GenerateButton** – przycisk inicjujacy proces generowania fiszek
  - **FlashcardProposalList** – lista wyświetlająca wygenerowane propozycje fiszek
    - **FlashcardProposalItem** – pojedynczy element listy z opcjami: zaakceptuj, edytuj, odrzuć
  - **LoadingIndicator** – wskaźnik ładowania, np. skeleton, wyśweitlany podczas oczekiwania na odpowiedź z API
  - **BulkSaveButton** – przycisk do zapisania wszystkich fiszek lub tylko zaakceptowanych
  - **ErrorAlert** – komponent wyświetlający komunikaty błędów

## 4. Szczegóły komponentów
### GenerateView
- **Opis komponentu**: Główny kontener widoku zarządzający stanem, integracją API oraz przekazywaniem danych do komponentów potomnych.
- **Główne elementy HTML**: Otaczający div lub sekcja zawierająca `TextInputForm`, `FlashcardProposalList`, `LoadingIndicator` oraz `ErrorAlert`.
- **Obsługiwane interakcje**: Inicjowanie wywołania API, przechowywanie listy fiszek, obsługa stanu ładowania i błędów.
- **Warunki walidacji**: Sprawdzenie, że wprowadzony tekst ma od 1000 do 10000 znaków przed wysłaniem żądania.
- **Typy**: Użycie `GenerateFlashcardsCommand` do wysłania danych oraz `GenerationCreateResponseDto` do odbioru odpowiedzi (definiowane w `types.ts`).
- **Propsy**: Brak, komponent najwyższego poziomu.

### TextInputForm
- **Opis komponentu**: Formularz przeznaczony do wprowadzania tekstu oraz przycisk do inicjowania generowania fiszek.
- **Główne elementy HTML**: Pole `textarea` oraz przycisk typu `submit`.
- **Obsługiwane interakcje**: Wprowadzenie tekstu, walidacja lokalna i kliknięcie przycisku, które wywołuje funkcję callback przekazaną przez rodzica.
- **Warunki walidacji**: Tekst musi zawierać od 1000 do 10000 znaków. W przypadku naruszenia, wyświetlenie komunikatu błędu.
- **Typy**: Lokalny stan `TextInputState` (np. { text: string, error?: string }).
- **Propsy**: Callback wywoływany przy submit, przekazujący poprawny tekst do `GenerateView`.

### GenerateButton
- **Opis komponentu**: Button inicjujący wywołanie API w celu wygenerowania fiszek. Umieszczony obok pola tekstowego.
- **Główne elementy HTML**: Element HTML `<button>` z etykietą "Generuj fiszki".
- **Obsługiwane interakcje**: Obsługuje zdarzenie `onClick`, które wywołuje callback przekazany przez rodzica. Przycisk przechodzi w stan "disabled" podczas wykonywania operacji lub gdy walidacja tekstu nie jest spełniona.
- **Warunki walidacji**: Przycisk aktywny tylko wtedy, gdy długość tekstu wynosi od 1000 do 10000 znaków.
- **Typy**: Wykorzystuje callback typu `() => void` jako prop.
- **Propsy**: `{ onClick: () => void, disabled: boolean }`.

### FlashcardProposalList
- **Opis komponentu**: Wyświetla listę wygenerowanych fiszek otrzymanych z API.
- **Główne elementy HTML**: Lista `<ul>` lub `<div>` zawierająca elementy typu `FlashcardProposalItem`.
- **Obsługiwane interakcje**: Przekazywanie akcji ze strony elementów listy, takich jak akceptacja, edycja czy odrzucenie fiszki.
- **Warunki walidacji**: Dane muszą być zgodne z typem `FlashcardProposalViewModel`.
- **Typy**: Użycie tablicy `FlashcardProposalViewModel`.
- **Propsy**: Lista propozycji fiszek oraz callbacki dla akcji (onAccept, onEdit, onReject).

### FlashcardProposalItem
- **Opis komponentu**: Pojedynczy element listy fiszek, prezentujący przód i tył fiszki oraz oferujący przyciski do akcji.
- **Główne elementy HTML**: Wyświetlanie tekstu fiszki, przyciski "Zaakceptuj", "Edytuj", "Odrzuć".
- **Obsługiwane interakcje**: Akceptacja fiszki, przełączenie do trybu edycji z walidacją oraz odrzucenie propozycji.
- **Warunki walidacji**: Podczas edycji, pola nie mogą być puste i muszą spełniać ustalone limity długości.
- **Typy**: Lokalny typ statusu (np. enum `ProposalStatus` - accepted, edited, rejected) oraz rozszerzony typ `FlashcardProposalViewModel`.
- **Propsy**: Dane fiszki oraz funkcje callback dla akcji.

### LoadingIndicator
- **Opis komponentu**: Komponent wyświetlający wskaźnik ładowania, np. spinner lub skeleton, aby użytkownik wiedział, że operacja jest w toku.
- **Główne elementy HTML**: Może być kontener `<div>` zawierający animowany spinner lub strukturę HTML/CSS do wyświetlania skeletonu.
- **Obsługiwane interakcje**: Brak interakcji – komponent służy wyłącznie do wizualnej informacji o stanie ładowania.
- **Typy**: Opcjonalnie przyjmuje prop `isLoading` typu boolean, który determinuje, czy wskaźnik jest widoczny.
- **Propsy**: `{ isLoading: boolean }`.

### ErrorAlert
- **Opis komponentu**: Komponent do prezentacji komunikatów błędów pochodzących z walidacji formularza lub błędów zwróconych przez API.
- **Główne elementy HTML**: Może być `<div>` lub inny kontener zawierający ikonę ostrzegawczą, wiadomość o błędzie oraz przycisk do zamknięcia alertu.
- **Obsługiwane interakcje**: Umożliwia zamknięcie alertu przez użytkownika (np. kliknięcie przycisku), wywołując funkcję callback `onDismiss`.
- **Typy**: Przyjmuje prop `errorMessage` typu string do wyświetlenia komunikatu oraz opcjonalny prop `onDismiss` typu `() => void`.
- **Propsy**: `{ errorMessage: string, onDismiss?: () => void }`.

### BulkSaveButton
- **Opis komponentu**: Button służący do zapisu fiszek do bazy danych. Umożliwia zapisanie wszystkich fiszek lub tylko zaakceptowanych, w zależności od logiki aplikacji.
- **Główne elementy HTML**: Element `<button>` z dynamiczną etykietą, np. "Zapisz wszystkie" lub "Zapisz zaakceptowane fiszki".
- **Obsługiwane interakcje**: Obsługuje zdarzenie `onClick`, które wywołuje funkcję zapisującą fiszki. Może otwierać modal z opcją wyboru trybu zapisu.
- **Warunki walidacji**: Przycisk aktywny, gdy lista fiszek nie jest pusta; powinien być dezaktywowany, gdy brak danych do zapisu.
- **Typy**: Wykorzystuje typ `CreateFlashcardsCommand` (definiowany w `types.ts`) do budowy żądania oraz ewentualny typ ViewModel `BulkSaveMode` (np. 'all' | 'accepted' | 'disabled').
- **Propsy**: `{ flashcards: FlashcardProposalDto[], onSave: (mode: 'all' | 'accepted') => void }`.

## 5. Typy
- **GenerateFlashcardsCommand**: { text: string } - wysyłany do endpoint `/generations`
- **GenerationCreateResponseDto**: Zawiera właściwości:
  - `generation`: obiekt typu `GenerationDto` (m.in. id, model, generated_count, created_at)
  - `flashcards_proposal`: tablica obiektów typu `FlashcardProposalDto` ({ front, back, source, generation_id }) - struktura odpowiedzi z API
- **FlashcardProposalDto**: { front: string, back: string, source: "ai-full" } - pojedyncza propozycja fiszki
- **FlashcardProposalViewModel**: Rozszerza `FlashcardProposalDto` o dodatkowe flagi:
  - `edited`: boolean – wskazuje, czy fiszka została edytowana przez użytkownika.
  - `accepted`: boolean – wskazuje, czy fiszka została zaakceptowana.

- **CreateFlashcardsCommand**: { flashcards: FlashcardCreateDto[] } - typ wykorzystywany do zapisu fiszek do bazy danych poprzez endpoint POST `/flashcards`. Każdy obiekt `FlashcardCreateDto` powinien zawierać pola: `front` (string), `back` (string), `source` (enum: 'ai-full' | 'ai-edited' | 'manual') oraz `generation_id` (number | null), gdzie pole `source` jest dynamicznie ustalane na podstawie flag w `FlashcardProposalViewModel`.

Te flagi umożliwiają dynamiczne ustawienie pola `source` przy wysyłaniu fiszek do API za pomocą endpointu `/flashcards`: 
- Jeśli `accepted` === true i `edited` === false, to `source` powinno mieć wartość 'ai-full'.
- Jeśli `accepted` === true i `edited` === true, to `source` powinno mieć wartość 'ai-edited'.
- W pozostałych przypadkach fiszka może być traktowana jako 'manual' lub nie być wysyłana do API.

## 6. Zarządzanie stanem
- Wykorzystanie hooków `useState` do zarządzania:
  - Stanem tekstu wprowadzanego przez użytkownika
  - Listą propozycji fiszek
  - Stanem ładowania (loading) oraz błędów (error)
- Opcjonalnie: utworzenie custom hooka `useGenerateFlashcards` do obsługi wywołania API i aktualizacji stanu.

## 7. Integracja API
- **Endpoint**: POST `/generations`
  - **Żądanie**: { text: string } zgodne z `GenerateFlashcardsCommand`
  - **Odpowiedź**: Obiekt `GenerationCreateResponseDto` zawierający dane generacji oraz propozycje fiszek
- Proces wywołania:
  - Po kliknięciu przycisku, tekst jest walidowany
  - Wywołanie API następuje z aktualizacją stanu ładowania
  - W przypadku sukcesu, aktualizowana jest lista propozycji
  - W razie błędu, wyświetlany jest komunikat w `ErrorAlert`

- **Endpoint**: POST `/flashcards`
  - **Żądanie**: Dane typu `CreateFlashcardsCommand`, czyli obiekt z polem `flashcards` (tablica obiektów `FlashcardCreateDto`). Payload budowany jest na podstawie wybranych fiszek – wszystkie lub tylko zaakceptowane – zgodnie z opcją wybraną przez użytkownika.
  - **Odpowiedź**: Odpowiedź API potwierdzająca zapis fiszek oraz zwracająca utworzone fiszki wraz z metadanymi.
- Proces integracji (dla zapisu fiszek):
  - Po wyborze trybu zapisu przez użytkownika (obsługiwanym przez `BulkSaveButton`), generowany jest payload zgodny z typem `CreateFlashcardsCommand`.
  - Następnie wywoływany jest endpoint POST `/flashcards`.
  - Odpowiedź jest obsługiwana poprzez aktualizację stanu widoku lub wyświetlenie komunikatu o błędzie.

## 8. Interakcje użytkownika
- Wprowadzenie tekstu w obszarze `textarea` w `TextInputForm`
- Kliknięcie przycisku "Generuj fiszki" 
    - rozpoczyna sie walidacja dlugosci tekstu
    - jeśli walidacja przejdzie uruchamia się wywołanie API
    - podczas oczekiwania, wyświetlany jest `LoadingIndicator`
- Po otrzymaniu danych, lista propozycji pojawia się w `FlashcardProposalList`
- Użytkownik może:
  - Kliknąć "Zaakceptuj", aby zatwierdzić daną fiszkę
  - Kliknąć "Edytuj", aby zmodyfikować treść fiszki (przy walidacji)
  - Kliknąć "Odrzuć", aby usunąć propozycję z widoku
- W przypadku błędów walidacyjnych lub API, odpowiedni komunikat pojawia się w `ErrorAlert`
- Komponent `BulkSaveButton` umozliwia wysłanie wybranych fiszek do zapisania w bazie (wywołanie API POST /flashcards)

## 9. Warunki i walidacja
- Tekst wejściowy musi mieć od 1000 do 10000 znaków – walidacja w `TextInputForm`
- Podczas edycji fiszki, pola nie mogą być puste i muszą być zgodne z przyjętymi limitami: front <= 200 znaków, back <= 500 znaków
- Przycisk generowania aktywowany tylko przy poprawnym walidowanym tekscie
- Odpowiedź z API jest sprawdzana pod kątem występowania wymaganych pól, komunikaty błędów wyświetlane w ErrorAlert

## 10. Obsługa błędów
- Wyświetlanie komunikatów błędów z walidacji formularza
- Przechwytywanie błędów podczas komunikacji z API i prezentacja w komponencie `ErrorAlert`
- Obsługa sytuacji brzegowych, takich jak błędy sieciowe lub nieprawidłowa odpowiedź API
- w przypadku błedów w zwiazanych z zapisem fiszek, stan ładowania resetowany, uzytkownik dostaje informacje o błędzie

## 11. Kroki implementacji
1. Utworzenie komponentu `GenerateView` i dodanie ścieżki routingu `/generate`.
2. Zaimplementowanie komponentu `TextInputForm` z polem tekstowym, przyciskiem oraz walidacją długości tekstu.
3. Utworzenie custom hooka (np. `useGenerateFlashcards`) do obsługi wywołań API i zarządzania stanem (loading, error, lista propozycji).
4. Implementacja komponentu `FlashcardProposalList` wraz z `FlashcardProposalItem` umożliwiających akcje: akceptacja, edycja oraz odrzucenie propozycji.
5. Dodanie komponentów `LoadingIndicator` i `ErrorAlert` w celu lepszego feedbacku użytkownika.
6. Zaimplementowanie przycisku `GenerateButton` i integracja z endpointem POST `/generations`, wysłanie danych oraz obsługa odpowiedzi zgodnie z `GenerationCreateResponseDto`.
7. Zaimplementowanie przycisku `BulkSaveButton` który zbiorczo bedzie wysyłam zadanie do endpoint POST `/flashcards` i walidacje danych.
8. Testowanie widoku pod kątem poprawności walidacji, obsługi błędów i interakcji użytkownika.
9. Dostrajanie responsywnosci.
10. Refaktoryzacja i optymalizacja kodu zgodnie z wytycznymi oraz feedbackiem z lintera. 