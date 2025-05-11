# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI
Przegląd struktury interfejsu użytkownika zakłada podział na kluczowe widoki: ekran logowania, dashboard, widok generowania fiszek, widok listy fiszek z modelem edycji, panel użytkownika oraz ekran sesji powtórkowych. Interfejs jest zgodny z dokumentem wymagań produktu (PRD) oraz planem API, a także wynikami sesji planowania oraz jest zbudowany wokół widoku generowania fiszek dostepnego po autoryzacji. Aplikacja zostanie zbudowana przy użyciu Astro, TypeScript i React, przy wykorzystaniu Tailwind CSS oraz komponentów Shadcn/ui. Globalny stan aplikacji będzie zarządzany przez React, z możliwością migracji do Zustand w przyszłości. Responsywność, dostępność (a11y) i bezpieczeństwo (ukierunkowane na JWT i autoryzację) są priorytetami.

## 2. Lista widoków
- **Widok uwierzytelniania (Auth)**
  - Ścieżka: `/login` i `/register`
  - Główny cel: Umożliwić użytkownikowi logowanie oraz rejestracje do systemu.
  - Kluczowe informacje: Formularze z polami e-mail i hasło, komunikaty błędów w przypadku nieprawidłowych danych.
  - Kluczowe komponenty widoku: Formular logowania/rejestracji, pola input, przycisk submit, walidacja formularza, komunikaty błędów.
  - UX, dostępność i bezpieczeństwo: Prosty i responsywny formularz, czytelne komunikaty błędów, obsługa klawiatury, zabezpieczenia przed brute-force, JWT i walidacja wejścia.

- **Widok generowania fiszek (AI Generation)**
  - Ścieżka: `/generate`
  - Główny cel: Umożliwienie użytkownikowi wprowadzenia tekstu w celu wygenerowania propozycji fiszek i ich rewizji za pomocą AI (zaakceptuj, edytuj i odrzuć).
  - Kluczowe informacje: Pole tekstowe (dla 1000-10000 znaków), lista wygenerowanych fiszek z opcjami akceptacji, edycji lub odrzucenia dla kadej fiszki.
  - Kluczowe komponenty widoku: Formularz tekstowy, przycisk "Generuj fiszki", lista propozycji, przyciski akcji (zapisz wszystkie, zapisz zaakceptowane), wskaźnik ładowania (skeleton), komunikaty błędów.
  - UX, dostępność i bezpieczeństwo: Intuicyjny formularz, responsywny, wyraźne komunikaty błędów, walidacja danych wejściowych (1000-10000 znaków).

- **Widok listy fiszek (Moje fiszki)**
  - Ścieżka: `/flashcards`
  - Główny cel: Prezentacja wszystkich fiszek użytkownika z możliwością edycji (poprzez modal) i usunięcia.
  - Kluczowe informacje: Lista zapisanych fiszek z informacja o pytaniu i odpowiedzi, przyciski edycji i usuwania, mechanizm lazy-loading lub infinite scroll.
  - Kluczowe komponenty widoku: Lista elementów, komponent modal do edycji, przyciski akcji (usuwanie, potwierdzenie), system komunikatów inline i toast notifications.
  - UX, dostępność i bezpieczeństwo: Przejrzysty i intuicyjny interfejs, wsparcie dla standardów WCAG, mechanizmy zabezpieczające przed przypadkowymi modyfikacjami, dostępność klawiatura modyfikacji.

- **Modal edycji fiszek**
  - Ścieżka: Wyświetlany nad widokiem listy fiszek
  - Główny cel: Umożliwienie edycji fiszek z walidacją danych bez zapisu w czasie rzeczywistym.
  - Kluczowe informacje: Formularz edycji fiszki, pola “Przód” oraz “Tył”, komunikaty walidacyjne.
  - Kluczowe komponenty widoku: Modal z formularzem, przyciski “Zapisz” i “Anuluj”.
  - UX, dostępność i bezpieczeństwo: Intuicyjny modal, dostępność dla czytników ekranu, walidacja danych po stronie klienta przed wysłaniem zmian.

- **Panel użytkownika**
  - Ścieżka: `/profile`
  - Główny cel: Wyświetlenie danych konta oraz ustawień użytkownika.
  - Kluczowe informacje: Podstawowe informacje o koncie, możliwość edycji kontem, przycisk wylogowania.
  - Kluczowe komponenty widoku: Formularz edycji konta, przyciski akcji.
  - UX, dostępność i bezpieczeństwo: Bezpieczne wylogowanie, łatwy dostep do ustawień, prosty i czytelny interfejs.

- **Ekran sesji powtórkowych (Review Session)**
  - Ścieżka: `/review-session`
  - Główny cel: Przeprowadzenie sesji powtórkowej flashcards zgodnie z algorytmem spaced repetition.
  - Kluczowe informacje: Prezentacja przodu fiszki, możliwość wyświetlenia tyłu po interakcji, system oceny nauki.
  - Kluczowe komponenty widoku: Komponent prezentacji fiszek, przyciski interakcji (np. "Pokaż odpowiedź", "Oceń"), animator przejść między fiszkami, licznik sesji.
  - UX, dostępność i bezpieczeństwo: Minimalistyczny i skoncentrowany interfejs, czytelne przyciski do interakcji o wysokim kontraście, responsywność, jasne komunikaty oraz zabezpieczenia przed przypadkowymi naciśnięciami, intuicyjny system przechodzenia między fiszkami.

## 3. Mapa podróży użytkownika
- Użytkownik rozpoczyna od wizyty na stronie logowania/rejestracji.
- Po udanym logowaniu użytkownik jest przekierowywany do widoku generowania fiszek.
- Uzytkownik  wprowadza tekst do AI i inicjuje proces generowania fiszek.
- Api zwraca proponowane fiszki, które są prezentowane na widoku generowania.
- Użytkownik przegląda wygenerowane propozycje, akceptuje, odrzuca lub edytuje fiszki w dedykowanym modalu oraz zapisuje zatwierdzone fiszki zbiorczo.
- Następnie użytkownik może przejść do widoku listy fiszek ("Moje fiszki"), by przeglądać, edytować lub usuwać fiszki według potrzeb.
- W panelu użytkownika ("Profile") użytkownik sprawdza swoje dane konta i zarządza ustawieniami.
- W przypadku potrzeby, użytkownik rozpoczyna sesję powtórkową, która wykorzystuje algorytm spaced repetition do nauki.
- Uzytkownik otrzymuje komunikaty błędów (walidacji, problemów z API) jako komunikaty inline.

## 4. Układ i struktura nawigacji
- Główne menu nawigacyjne umieszczone jest w górnej części interfejsu, umożliwiając łatwy dostęp do kluczowych widoków: Generowanie fiszek, Moje fiszki, Sesja nauki, Profile.
- Responsywny design gwarantuje, że nawigacja jest intuicyjna zarówno na urządzeniach desktopowych, jak i mobilnych (np. z wykorzystaniem hamburger menu).
- Nawigacja odbywa się asynchronicznie z widocznymi wskaźnikami ładowania oraz obsługą błędów w przypadku problemów z komunikacją z AP, umoliwia bezporblemowe przechodzenie między widokami zachowując stan sessji.

## 5. Kluczowe komponenty
- **Formularze**: Komponenty formularzy z walidacją danych wejściowych, zarówno dla widoku logowania jak i rejestracji.
- **Komponent generowania fiszek**: Z polem tekstowym i przyciskiem uruchamiania preces generacji z wskaźnikiem ładowania.
- **Modal**: Reużywalny komponent modal, wykorzystywany do edycji fiszek z walidacja danych przeds zatwierdzeniem.
- **Lista z Lazy-loading/Infinite Scroll**: Mechanizm dynamicznego wczytywania danych w widoku listy fiszek z opcjami edycji i usuwania.
- **Toast Notifications**: Komponent do wyświetlania komunikatów sukcesu i błędów w odpowiedzi na akcje użytkownika. 
- **Menu Nawigacji**: Elementy nawigacyjne ułatwiające przemieszczanie się między widokami. 
- **Komponent sessji powtórek**: Interaktywny układ wyświetlania fiszek podczas sesji nauki z mechanizmem oceny.