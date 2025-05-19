# Plan testów projektu

## 1. Cel testów
Celem testów jest zapewnienie wysokiej jakości, niezawodności oraz bezpieczeństwa aplikacji poprzez weryfikację poprawności działania wszystkich kluczowych komponentów systemu, w tym logiki biznesowej, interfejsu użytkownika, API oraz integracji zewnętrznych.

## 2. Zakres testów
Plan testów obejmuje:
- **Testy jednostkowe:** Weryfikacja działania poszczególnych funkcji, metod oraz komponentów.
- **Testy integracyjne:** Sprawdzenie poprawności interakcji między modułami, np. między komponentami UI, API a bazą danych.
- **Testy end-to-end:** Skompletowane scenariusze symulujące przepływ użytkownika przez cały system.
- **Testy statycznej analizy:** Walidacja typów w TypeScript, analiza kodu przy użyciu ESLint oraz Prettier.
- **Testy wydajnościowe:** Weryfikacja performance'u frontendu i API.
- **Testy wizualne:** Automatyczna detekcja zmian wizualnych w komponentach UI.

## 3. Kluczowe obszary i priorytety
### 3.1 Komponenty UI
- **Lokalizacja:** `/src/components` oraz `/src/components/ui`
- **Priorytet:** Wysoki
- **Szczegóły testów:**
  - Testy renderowania oraz poprawnego wyświetlania komponentów.
  - Weryfikacja interakcji użytkownika (kliknięcia, zmiana stanu, walidacja formularzy).
  - Sprawdzenie responsywności i zgodności ze stylami (Tailwind, Shadcn/ui).

### 3.2 Strony i układy (Layouts)
- **Lokalizacja:** `/src/pages` oraz `/src/layouts`
- **Priorytet:** Średni
- **Szczegóły testów:**
  - Testy poprawności renderowania dynamicznych treści.
  - Weryfikacja przekazywania propsów oraz poprawności routingu.
  - Testy kompatybilności z layoutami Astro.

### 3.3 API oraz middleware
- **Lokalizacja:** `/src/pages/api` oraz `/src/middleware`
- **Priorytet:** Wysoki
- **Szczegóły testów:**
  - Testy endpointów API – sprawdzenie statusów odpowiedzi (200, 400, 500) przy różnych scenariuszach.
  - Weryfikacja logiki autentykacji i autoryzacji w warstwie middleware.
  - Symulacja warunków błędnych i test obsługi wyjątków.

### 3.4 Logika biznesowa i utilsy
- **Lokalizacja:** `/src/lib` oraz `/src/db`
- **Priorytet:** Średni
- **Szczegóły testów:**
  - Testy funkcjonalności pomocniczych oraz usług (np. operacje na bazie danych Supabase).
  - Weryfikacja zgodności typów oraz poprawność implementacji zawartych w `/src/types.ts`.

## 4. Rodzaje testów i narzędzia
- **Testy jednostkowe:**
  - Framework: Vitest (zamiennik Jest) - szybszy i lepiej zintegrowany z Vite/Astro
  - Narzędzia: 
    - React Testing Library do testowania komponentów
    - Testing Library User Event dla realistycznej symulacji interakcji
    - MSW (Mock Service Worker) dla mockowania API
- **Testy integracyjne:**
  - Framework: Vitest z mockami
  - Narzędzia: 
    - Hoppscotch dla testów API
    - Faker.js/Test Data Bot dla zarządzania danymi testowymi
- **Testy end-to-end:**
  - Framework: Playwright
    - Wsparcie dla wielu przeglądarek
    - Wbudowane narzędzia debugowania
    - Możliwość testowania API
- **Testy statycznej analizy:**
  - Narzędzia: TypeScript compiler, ESLint, Prettier
  - SonarQube lub Codecov dla analizy pokrycia kodu
- **Testy wizualne:**
  - Storybook z CSF 3.0
  - Chromatic dla testów regresji wizualnej
  - Storybook Test Runner dla automatyzacji
- **Testy wydajnościowe:**
  - Lighthouse CI dla frontendu
  - k6 dla testów obciążeniowych API

## 5. Środowisko testowe
- **Lokalne:** 
  - Testy wykonywane na maszynach deweloperskich
  - Watch Mode z hot reloadingiem dla szybkiego feedbacku
  - Docker dla izolacji środowiska
- **CI/CD:** 
  - Automatyczne uruchamianie testów poprzez GitHub Actions
  - Test Impact Analysis dla optymalizacji czasu wykonania
  - Status Checks dla automatycznej weryfikacji PR
- **Baza danych:** 
  - Dedykowane instancje testowe Supabase
  - Izolowane środowiska dla testów integracyjnych

## 6. Proces wykonywania testów
1. **Testy jednostkowe i integracyjne:**
   - Uruchamiane lokalnie za pomocą `npm test` lub `yarn test`
   - Watch Mode dla developmentu
   - Automatyczna weryfikacja w pipeline CI/CD
2. **Testy end-to-end:**
   - Playwright Test Runner w CI/CD
   - Możliwość uruchamiania wybranych scenariuszy lokalnie
3. **Analiza statyczna:**
   - Pre-commit hooki z husky
   - Automatyczna analiza w pipeline
4. **Raportowanie:**
   - Automatyczne raporty z Codecov/SonarQube
   - Allure dla wizualizacji wyników testów
   - Integracja z Slack/Teams dla notyfikacji

## 7. Raportowanie wyników testów
- TestOmatio lub Allure dla kompleksowej wizualizacji i zarządzania testami
- Automatyczna agregacja wyników z różnych rodzajów testów
- Dashboardy z metrykami i trendami
- Integracja z systemem zarządzania projektami (Jira/Linear)

## 8. Podsumowanie i przyszłe kroki
Plan testów będzie uaktualniany równolegle z rozwojem projektu. Priorytetem jest szybkie wykrywanie potencjalnych błędów oraz utrzymanie wysokiej jakości kodu. Planowane usprawnienia:
- Rozbudowa testów wydajnościowych i monitoringu
- Implementacja Test Impact Analysis dla optymalizacji CI/CD
- Automatyzacja procesu zarządzania danymi testowymi
- Wdrożenie zaawansowanych metryk jakości kodu
- Integracja z narzędziami AI do analizy testów i sugestii ulepszeń