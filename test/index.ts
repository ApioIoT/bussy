import Bussy from '../src'

const events = Bussy.createEventBus()

events.on('test.*', (event, data, d) => {
  console.log(event, data, d)
})

events.emit('test.a', 'Ciao', 'Mondo')
events.emit('test.b', 'Mondo')

type User = {
  id: number
  name: string
}

const data = Bussy.createDataBus<User>()

const unsub2 = data.listen((user) => {
  console.log(user.id, user.name)
  unsub2()
})

data.publish({ id: 1, name: 'Mario' })
data.publish({ id: 2, name: 'Piero' })

const request = Bussy.createRequestBus<string, number>()

request.listen((data, reply) => {
  reply(data.length)
})

request.create('Messaggio', (res, err) => {
  if (err) {
    console.error(err)
  } else {
    console.log(res)
  }
})

const main = async () => {
  try {
    const res = await request.createAsync('Messaggio async')
    console.log(res)
  } catch (e) {
    console.error(e)
  }
}

main()
