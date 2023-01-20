require('dotenv').config()
const { Kafka } = require('kafkajs')
const MongoClient = require('mongodb').MongoClient
 
const kafka = new Kafka({
    clientId: 'transaction-client',
    brokers: [process.env.KAFKA_SERVER],
})

kafka_consumer()

async function kafka_consumer() {
    const consumer = kafka.consumer({ groupId: 'account-subscription', allowAutoTopicCreation: true })
    await consumer.connect()
    await consumer.subscribe({ topic: 'transaction-topic', fromBeginning: true })
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            console.log({ value: message.value.toString() })
            var jsonObj = JSON.parse(message.value.toString())
            MongoClient.connect(process.env.DB_MONGO_URI, function (err, db) {
                if (err) throw err
                console.log(jsonObj)
                const query = jsonObj
                db.db(process.env.DB_MONGO_DATABASE_MOVEMENT).collection("movement").insertOne(query)
            })
        }
    })
}