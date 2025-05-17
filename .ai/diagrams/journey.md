```mermaid
stateDiagram-v2
    [*] --> "Strona Główna"
    "Strona Główna" --> "Logowanie": Kliknij "Logowanie"
    "Strona Główna" --> "Rejestracja": Kliknij "Rejestracja"
    "Strona Główna" --> "Odzyskiwanie Hasła": Kliknij "Odzyskanie Hasła"

    state "Logowanie" as L {
        [*] --> "Formularz Logowania"
        "Formularz Logowania" --> "Walidacja Logowania": Dane poprawne?
        "Walidacja Logowania" --> "Logowanie Sukces": Tak
        "Walidacja Logowania" --> "Logowanie Błąd": Nie
        "Logowanie Sukces" --> "Panel Użytkownika": Przejście do panelu
        "Logowanie Błąd" --> "Formularz Logowania": Pokaż błąd
    }

    state "Rejestracja" as R {
        [*] --> "Formularz Rejestracji"
        "Formularz Rejestracji" --> "Walidacja Rejestracji": Walidacja danych
        "Walidacja Rejestracji" --> "Rejestracja Sukces": Dane poprawne
        "Walidacja Rejestracji" --> "Rejestracja Błąd": Dane niepoprawne
        "Rejestracja Sukces" --> "Potwierdzenie Email": Wyślij email weryfikacyjny
        "Potwierdzenie Email" --> "Aktywacja Konta": Potwierdzenie od użytkownika
        "Aktywacja Konta" --> "Panel Użytkownika": Konto aktywne
        "Rejestracja Błąd" --> "Formularz Rejestracji": Wyświetl błąd
    }

    state "Odzyskiwanie Hasła" as O {
        [*] --> "Formularz Odzyskiwania"
        "Formularz Odzyskiwania" --> "Wysłanie Linku": Dane poprawne?
        "Wysłanie Linku" --> "Link Wysłany": Tak
        "Wysłanie Linku" --> "Odzyskiwanie Błąd": Nie
        "Link Wysłany" --> "Kliknięcie Linku": Użytkownik klika link z emaila
        "Kliknięcie Linku" --> "Weryfikacja Tokenu": Inicjacja procesu resetu hasła
        "Weryfikacja Tokenu" --> "Formularz Resetu": Token poprawny
        "Weryfikacja Tokenu" --> "Reset Link Błąd": Token niepoprawny
        "Formularz Resetu" --> "Reset Sukces": Reset udany
        "Formularz Resetu" --> "Reset Błąd": Reset nieudany
        "Reset Sukces" --> "Panel Użytkownika": Przejdź do panelu
        "Reset Błąd" --> "Formularz Resetu": Pokaż błąd
        "Odzyskiwanie Błąd" --> "Formularz Odzyskiwania": Pokaż błąd
    }

    "Panel Użytkownika" --> "Wylogowanie": Kliknij "Wyloguj"
    "Wylogowanie" --> "Strona Główna": Wylogowanie udane
    "Panel Użytkownika" --> [*]
    "Strona Główna" --> [*]
``` 