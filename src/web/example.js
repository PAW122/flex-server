window.onload = initial

// ta funkcja będzie wykonywana zawsze po wczytaniu strony
async function initial() {
    /*
        (przykładowe)
        zapisywanie danych na serwer
        db_save - url polecenia
        POST - typ requestu
        body - dane
            > path - id pod którym będą zapisane dane
            > data - dane które będą zapisane pod kluczem path

        w tym kodzie zapisujemy wartość {"test_id": "test_value"} pod kluczem test_path
        czyli zapisane zostaje test_path:{"test_id": "test_value"}
    */
    let response = await fetch("db_save", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: "test_path",
            data: {"test_id": "test_value"}
        })
    })
    if (!response.ok) {
        throw new Error("Response error");
    }



    /*
        (przykładowe)
        odczytywabnie danych z serwera
        db_read - url polecenia
        POST - typ requestu
        body - dane
            > path - id z pod którego odczytamy dane

        body - zmienna w której zostaną zapisane dane zwrócone przez serwer
    */
    let read_res = await fetch("db_read", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: "test_path"
        })
    })
    if (!response.ok) {
        throw new Error("Response error");
    }
    let body = await read_res.json();
    if (!body) return console.log("Error undefined body");
    console.log(body.data)
}