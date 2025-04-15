# x10Cards Database Schema

## 1. Tabele

> Tabela użytkowników zarządzana przez Supabase Auth.

### 1.1. users

- **id**: `UUID PRIMARY KEY` – unikalny identyfikator użytkownika  
- **email**: `VARCHAR(255) NOT NULL UNIQUE` – adres e-mail użytkownika  
- **encrypted_password**: `VARCHAR NOT NULL` – zaszyfrowane hasło  
- **created_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data utworzenia konta  
- **updated_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data ostatniej aktualizacji  

---

### 1.2. flashcards

> Fiszki tworzone przez użytkowników ręcznie lub automatycznie.

- **id**: `BIGSERIAL PRIMARY KEY` – unikalny identyfikator fiszki  
- **front**: `VARCHAR(200) NOT NULL` – treść pytania  
- **back**: `VARCHAR(500) NOT NULL` – treść odpowiedzi  
- **source**: `VARCHAR NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual'))` – źródło pochodzenia fiszki  
- **generation_id**: `BIGINT REFERENCES generations(id) ON DELETE SET NULL` – opcjonalna referencja do generacji  
- **user_id**: `UUID NOT NULL REFERENCES users(id)` – użytkownik, który utworzył fiszkę  
- **created_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data utworzenia  
- **updated_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data ostatniej aktualizacji  

> *Trigger: automatycznie aktualizuje kolumnę `updated_at` przy każdej modyfikacji rekordu.*

---

### 1.3. generations

> Dane dotyczące generowanych treści (np. z AI) przez użytkowników.

- **id**: `BIGSERIAL PRIMARY KEY` – unikalny identyfikator generacji  
- **user_id**: `UUID NOT NULL REFERENCES users(id)` – użytkownik, który zainicjował generację  
- **model**: `VARCHAR NOT NULL` – użyty model  
- **generated_count**: `INTEGER NOT NULL` – liczba wygenerowanych jednostek  
- **accepted_unedited_count**: `INTEGER` – liczba zaakceptowanych bez edycji  
- **accepted_edited_count**: `INTEGER` – liczba zaakceptowanych po edycji  
- **source_text_hash**: `VARCHAR NOT NULL` – hash tekstu źródłowego  
- **source_text_length**: `INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)` – długość tekstu źródłowego  
- **generation_duration**: `INTEGER NOT NULL` – czas trwania generacji w ms  
- **created_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data utworzenia  
- **updated_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data ostatniej aktualizacji  

---

### 1.4. generation_error_logs

> Logi błędów związanych z nieudanymi generacjami.

- **id**: `BIGSERIAL PRIMARY KEY` – unikalny identyfikator błędu  
- **user_id**: `UUID NOT NULL REFERENCES users(id)` – użytkownik, którego dotyczy błąd  
- **model**: `VARCHAR NOT NULL` – model, który spowodował błąd  
- **source_text_hash**: `VARCHAR NOT NULL` – hash tekstu źródłowego  
- **source_text_length**: `INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)` – długość tekstu  
- **error_code**: `VARCHAR(100) NOT NULL` – kod błędu  
- **error_message**: `TEXT NOT NULL` – opis błędu  
- **created_at**: `TIMESTAMPTZ NOT NULL DEFAULT now()` – data wystąpienia błędu  

---

## 2. Relacje

- Jeden użytkownik (`users`) może mieć wiele fiszek (`flashcards`).  
- Jeden użytkownik może mieć wiele rekordów w tabeli `generations`.  
- Jeden użytkownik może mieć wiele logów w tabeli `generation_error_logs`.  
- Każda fiszka może opcjonalnie odnosić się do jednej generacji (`generations`) przez `generation_id`.

---

## 3. Indeksy

- Indeks na kolumnie `user_id` w tabeli `flashcards`.  
- Indeks na kolumnie `generation_id` w tabeli `flashcards`.  
- Indeks na kolumnie `user_id` w tabeli `generations`.  
- Indeks na kolumnie `user_id` w tabeli `generation_error_logs`.

---

## 4. Zasady RLS (Row-Level Security)

– W tabelach `flashcards`, `generations` oraz `generation_error_logs` należy wdrożyć polityki RLS, które pozwalają użytkownikowi na dostęp wyłącznie do swoich rekordów – tam, gdzie `user_id` odpowiada identyfikatorowi użytkownika z Supabase Auth (np. `auth.uid() = user_id`).

---

## 5. Dodatkowe uwagi

– W tabeli `flashcards` należy zastosować trigger, który automatycznie aktualizuje kolumnę `updated_at` przy każdej modyfikacji rekordu.  