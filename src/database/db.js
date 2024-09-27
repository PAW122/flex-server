import fs from "node:fs";

function log_err(message) {
    if(!logs) return
    console.error(message)
}

export class Database {
    constructor(file_path) {
        this.file_path = file_path
    }

    /**
     * init
     * sprawdza czy istnieje dany plik, jeżeli nie to go tworzy
     */
    init() {
        // Sprawdź czy plik istnieje
        if (!fs.existsSync(this.file_path)) {
            // Jeżeli plik nie istnieje, utwórz go
            fs.writeFileSync(this.file_path, JSON.stringify({}), 'utf-8');
            //console.log(`Plik ${this.file_path} został utworzony.`);
        } else {
            //console.log(`Plik ${this.file_path} już istnieje.`);
            // console.log("db is working")
        }
    }

    getAllKeys() {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));
        return Object.keys(database);
    }

    /**
     * write
     * Dodaje nowy wpis do bazy danych
     * @param {string} path - Ścieżka do elementu w bazie danych (np. "table1.users.userid.example_user_id")
     * @param {object} data - Dane do zapisania
     */
    write(path, data) {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));

        //save wothout the path
        let current = database;
        if(path === true) {
            current = data
            fs.writeFileSync(this.file_path, JSON.stringify(database, null, 2), 'utf-8');
            return;
        }
        const pathSegments = path.split('.');

        // Przechodzi po ścieżce do odpowiedniego miejsca w bazie danych
        for (let i = 0; i < pathSegments.length - 1; i++) {
            if (!current[pathSegments[i]]) {
                current[pathSegments[i]] = {};
            }
            current = current[pathSegments[i]];
        }

        // Dodaje nowy wpis
        current[pathSegments[pathSegments.length - 1]] = data;

        // Zapisuje zmienioną bazę danych z powrotem do pliku JSON
        fs.writeFileSync(this.file_path, JSON.stringify(database, null, 2), 'utf-8');
        //console.log(`Nowy wpis został dodany do ${path}.`);
    }


    /**
 * add
 * Dodaje lub aktualizuje wpis w bazie danych
 * @param {string} path - Ścieżka do elementu w bazie danych (np. "table1.users.userid.example_user_id")
 * @param {object} data - Nowe dane do dodania lub aktualizacji
 */
    push(path, data) {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));
        const pathSegments = path.split('.');
        let current = database;

        // Przechodzi po ścieżce do odpowiedniego miejsca w bazie danych
        for (let i = 0; i < pathSegments.length - 1; i++) {
            if (!current[pathSegments[i]]) {
                current[pathSegments[i]] = {};
            }
            current = current[pathSegments[i]];
        }

        // Aktualizuje istniejące pola
        current[pathSegments[pathSegments.length - 1]] = {
            ...current[pathSegments[pathSegments.length - 1]],
            ...data
        };

        // Zapisuje zmienioną bazę danych z powrotem do pliku JSON
        fs.writeFileSync(this.file_path, JSON.stringify(database, null, 2), 'utf-8');
        //console.log(`Dane w ${path} zostały zaktualizowane.`);
    }

    /**
      * addToList
      * Dodaje nowy element do listy w bazie danych
      * @param {string} path - Ścieżka do listy w bazie danych (np. "guildMemberUpdate")
      * @param {object} data - Nowe dane do dodania do listy
      */
    addToList(path, data) {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));
        const pathSegments = path.split('.');
        let current = database;
    
        // Przechodzi po ścieżce, tworząc brakujące elementy w bazie danych
        for (let i = 0; i < pathSegments.length; i++) {
            if (!current[pathSegments[i]]) {
                // Jeśli to ostatni segment ścieżki, utwórz pustą listę
                if (i === pathSegments.length - 1) {
                    current[pathSegments[i]] = [];
                } else {
                    current[pathSegments[i]] = {};
                }
            }
            current = current[pathSegments[i]];
        }
    
        // Dodaje nowy element do listy
        current.push(data);
    
        // Zapisuje zmienioną bazę danych z powrotem do pliku JSON
        fs.writeFileSync(this.file_path, JSON.stringify(database, null, 2), 'utf-8');
        //console.log(`Nowy element został dodany do listy w ${path}.`);
    }
    
    

    /**
      * readList
      * Odczytuje określoną ilość elementów z listy
      * @param {string} path - Ścieżka do listy w bazie danych (np. "guildMemberUpdate")
      * @param {object} amount - ilość elementów do odczytania
      */
    readList(path, amount = null) {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));
        const pathSegments = path.split('.');
        let current = database;
    
        // Przechodzi po ścieżce do odpowiedniego miejsca w bazie danych
        for (let i = 0; i < pathSegments.length; i++) {
            current = current[pathSegments[i]];
            if (!current) {
                log_err(`Path ${path} does not exist in the database.`);
                return null;
            }
        }
    
        // Sprawdza czy ścieżka prowadzi do tablicy
        if (!Array.isArray(current)) {
            log_err(`Path ${path} does not lead to an array.`);
            return null;
        }
    
        // Zwraca pełną listę, jeśli amount jest null
        if (amount === null) return current;
    
        // Jeżeli amount jest większe niż długość listy, zwraca całą listę
        if (amount >= current.length) return current;
    
        // Zwraca ostatnie 'amount' elementów z listy
        return current.slice(-amount);
    }
    

    /**
     * read
     * Odczytuje dane z bazy danych
     * @param {string} path - Ścieżka do elementu w bazie danych (np. "table1.users.userid.example_user_id")
     * path = true - load all data
     * @returns {object|null} - Dane z bazy danych lub null, jeśli ścieżka nie istnieje
     */
    read(path) {
        try {
            const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));

            if(path === true) {
                return database
            }


            const pathSegments = path.split('.');
            let current = database;

            // Przechodzi po ścieżce do odpowiedniego miejsca w bazie danych
            for (let i = 0; i < pathSegments.length; i++) {
                if (!current[pathSegments[i]]) {
                    return null; // Jeśli którakolwiek część ścieżki nie istnieje, zwróć null
                }
                current = current[pathSegments[i]];
            }

            return current;
        } catch (error) {
            logger.error('Błąd odczytu bazy danych:', error);
            return null;
        }
    }


    /**
     * add
     * Dodaje nowy wpis do bazy danych w sposób opisany przez użytkownika
     * @param {string} path - Ścieżka do elementu w bazie danych (np. "testuser")
     * @param {object} data - Dane do dodania np: [interaction_id]: content
     */
    add(path, data) {
        const database = JSON.parse(fs.readFileSync(this.file_path, 'utf-8'));
        const pathSegments = path.split('.');
        const user_id = pathSegments[0];

        // Sprawdza, czy użytkownik już istnieje w bazie danych
        if (!database[user_id]) {
            database[user_id] = {};
        }

        // Dla każdej właściwości w danych, dodaj ją do obecnej wartości (jeśli istnieje)
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // Jeżeli istnieje już wartość dla danego klucza, dodaj nową wartość do istniejącej
                if (database[user_id][key]) {
                    if (Array.isArray(database[user_id][key])) {
                        // Jeżeli już jest tablica, dodaj nowy element do niej
                        database[user_id][key].push(data[key]);
                    } else {
                        // Jeżeli nie jest tablicą, zamień to w tablicę i dodaj nowy element
                        database[user_id][key] = [database[user_id][key], data[key]];
                    }
                } else {
                    // Jeżeli nie istnieje jeszcze wartość dla danego klucza, po prostu przypisz ją
                    database[user_id][key] = data[key];
                }
            }
        }

        // Zapisuje zmienioną bazę danych z powrotem do pliku JSON
        fs.writeFileSync(this.file_path, JSON.stringify(database, null, 2), 'utf-8');
        //console.log(`Nowy wpis został dodany do ${path}.`);
    }

    getCurrentFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            log_err('Error getting current file size:', error);
            return null;
        }
    }

}