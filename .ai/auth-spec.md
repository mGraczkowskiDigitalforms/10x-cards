# Specyfikacja modułu autentykacji

Ta specyfikacja opisuje architekturę modułu rejestracji, logowania, odzyskiwania hasła użytkowników oraz reset hasla w aplikacji 10x-cards. Dokument obejmuje warstwę frontendu, logikę backendową oraz system autentykacji, zgodnie z wymaganiami z dokumentu PRD (US-001, US-002) oraz stosowanym stackiem technologicznym (Astro, React, TypeScript, Tailwind, Shadcn/ui, Supabase).

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### Struktura stron i layoutów
- Utworzone zostaną dedykowane strony: `/login`, `/register`, `/forgot-password` oraz `reset-password`.
- Główne layouty zostaną podzielone na dwa tryby: auth (użytkownik zalogowany) i non-auth (użytkownik niezalogowany). W layout dla auth dodany zostanie pasek z przyciskiem wylogowania, informacją o użytkowniku itp.
- Komponenty UI wykorzystywane zostaną z biblioteki Shadcn/ui i będą stylowane przy użyciu Tailwind CSS.

### Podział odpowiedzialności
- Warstwa Astro będzie odpowiedzialna za SSR (server-side rendering) oraz dystrybucję stron, w tym przygotowanie layoutów i nawigację w aplikacji.
- Komponenty React w obrębie stron będą obsługiwały logikę formularzy, walidację na poziomie klienta oraz interakcje użytkownika (np. dynamiczne komunikaty błędów, obsługa loaderów przy wysyłaniu formularzy).
- Formularze rejestracji i logowania będą wysyłać zapytania do dedykowanych endpointów API (np. `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`).

### Walidacja i obsługa błędów
- Na poziomie formularzy klienta zastosowana zostanie walidacja pól (np. prawidłowy format adresu email, zgodność haseł).
- Komunikaty błędów będą wyświetlane użytkownikowi w formie toastów lub pod formularzem, z jasnym opisem problemu.
- Scenariusze błędów obejmują: błędne dane logowania, niezgodne hasła przy rejestracji, nieistniejący użytkownik przy odzyskiwaniu hasła.
- W przypadku błędów serwerowych wyświetlony zostanie stosowny komunikat informujący o problemie i ewentualnych krokach naprawczych.

### Obsługa scenariuszy użytkownika
- Rejestracja: Użytkownik wypełnia formularz rejestracyjny: pole email, hasło oraz potwierdzenie hasła. Po zatwierdzeniu, jeśli walidacja przeszła, formularz wysyła dane do API. Po pomyślnej rejestracji, użytkownik zostaje automatycznie zalogowany i przeniesiony do widoku głównego.
- Logowanie: Użytkownik wprowadza email oraz hasło, a w przypadku pomyślnego logowania jest przekierowywany do chronionych stron. W razie błędnych danych użytkownik otrzymuje komunikat o błędzie. Przekaz uzytkownikaa jako props w @index.astro do aplikacji Reacta, gdzie moze nastapic inicjalizacja auth store
- Odzyskiwanie hasła: Użytkownik podaje adres email i otrzymuje link do resetu hasła. Strona resetu hasła umożliwia ustawienie nowego hasła po poprawnym zweryfikowaniu tokenu.
- Reset hasła: Strona ta umożliwia wprowadzenie i potwierdzenie nowego hasła. Po poprawnym wprowadzeniu nowego hasła i jego potwierdzeniu, hasło jest zmieniane. Cały proces jest możliwy dzięki poprawnej weryfikacji tokenu, który jest częścią otrzymanego linku.

## 2. LOGIKA BACKENDOWA

### Struktura endpointów API
- Utworzone zostaną następujące endpointy w obrębie `src/pages/api/auth`:
  - `/register` – rejestracja nowych użytkowników
  - `/login` – logowanie
  - `/logout` – wylogowanie
  - `/forgot-password` – wysłanie linku do resetu hasła
  - `/reset-password` – ustawienie nowego hasła po weryfikacji
- Każdy endpoint będzie implementował odpowiednią logikę integracji z Supabase Auth oraz walidację danych wejściowych.

### Walidacja danych wejściowych
- Mechanizm walidacji danych, wykorzystujący biblioteki takie jak Zod lub Joi, będzie stosowany zarówno na poziomie API, jak i w logice klienta.
- Walidacja obejmuje: format email, minimalną długość hasła, zgodność haseł (dla rejestracji) oraz poprawność tokenów w procesie resetowania hasła.

### Obsługa wyjątków
- Każdy endpoint API zawiera obsługę błędów przy użyciu struktury try/catch.
- W przypadku wystąpienia błędów serwerowych lub błędnie przetworzonych zapytań, aplikacja zwraca odpowiednie statusy HTTP (np. 400, 401, 500) wraz z opisem błędu.
- Stosowana będzie jednolita struktura odpowiedzi z serwera, zawierająca klucz `error` lub `message`.

### Integracja z SSR i Astro
- Wybrane strony wymagające autoryzacji będą renderowane server-side, przy czym bieżący stan uwierzytelnienia użytkownika będzie weryfikowany przed renderowaniem.
- Konfiguracja Astro (`astro.config.mjs`) zostanie zaktualizowana o middleware przechwytujące żądania, sprawdzające tokeny Supabase oraz przekierowujące użytkownika do stron logowania w przypadku braku autoryzacji.

## 3. SYSTEM AUTENTYKACJI

### Wykorzystanie Supabase Auth
- Supabase Auth będzie głównym mechanizmem zarządzania użytkownikami:
  - Rejestracja: wykorzystanie metody `supabase.auth.signUp`
  - Logowanie: wykorzystanie metody `supabase.auth.signIn`
  - Wylogowanie: wykorzystanie metody `supabase.auth.signOut`
  - Odzyskiwanie hasła: wykorzystanie mechanizmu resetu hasła oferowanego przez Supabase (wysłanie linku resetującego na podany adres email)
  - Resetowanie hasła: wykorzystanie metody `supabase.auth.update({ password: 'nowe_haslo' })` dostarczonej przez Supabase
- Funkcjonalności te zostaną zaimplementowane w dedykowanych endpointach API oraz zintegrowane z warstwą frontendową poprzez bezpośrednie odwołania do metod Supabase.

### Integracja z interfejsem użytkownika
- Aplikacja, korzystając ze środowiska Astro, będzie integrować Supabase Auth zarówno w logice renderowania stron server-side, jak i w komponentach interaktywnych React.
- Klient-side komponenty odpowiadające za formularze autoryzacji będą komunikować się z endpointami API korzystającymi z Supabase.
- Stworzony zostanie również moduł abstrakcji (np. w `src/lib/supabase.ts`), który centralizuje wywołania do Supabase i ułatwia zarządzanie sesjami użytkowników.

## Kluczowe komponenty, moduły i kontrakty
- Frontend:
  - Astro Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`
  - Layouts: Authenticated layout i Non-Authenticated layout w `src/layouts`
  - React Components: Formularze "LoginForm", "RegisterForm", "ForgotPasswordForm", "ResetPasswordForm"
  - Stylizacja: Tailwind CSS i Shadcn/ui
- Backend:
  - API Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`
  - Walidacja: Zod/Joi schema for registration and login data
  - Error Handling: Central error middleware for unified error response structure
- Autentykacja:
  - Supabase Client: Konfiguracja klienta w `src/lib/supabase.ts`
  - Token Management: Obsługa tokenów autoryzacyjnych i middleware do weryfikacji sesji

## Podsumowanie

Moduł autentykacji został zaprojektowany tak, aby zapewnić wysoką skalowalność, bezpieczeństwo i zgodność z obecnym działaniem aplikacji. Rozwiązanie wykorzystuje nowoczesne technologie oraz sprawdzone praktyki wdrażania interfejsu użytkownika i API, zapewniając spójność z architekturą całego projektu 10x-cards. 