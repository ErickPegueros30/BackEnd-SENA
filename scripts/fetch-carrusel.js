const url = 'http://localhost:3000/api/paginas/home/carrusel'

async function run() {
  try {
    const res = await fetch(url)
    const body = await res.json()
    console.log(JSON.stringify(body, null, 2))
  } catch (err) {
    console.error('ERROR', err)
    process.exitCode = 2
  }
}

run()
