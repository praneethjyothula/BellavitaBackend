const express = require('express')

const app = express()

app.use(express.json())


const cors = require('cors')

app.use(cors())
const { open } = require('sqlite')

const sqlite3 = require('sqlite3')

const path = require('path')


const dbpath = path.join(__dirname, 'test.db')


const bcrypt = require('bcrypt')

const jsonWebToken = require('jsonwebtoken')



let db = null;

const initalize = async () => {
    try {
        db = await open({
            filename: dbpath,
            driver: sqlite3.Database
        })

        app.listen(4000, () => {
            console.log('SERVER STARTED AT http://localhost:4000')
        })
    } catch (e) {
        console.log(e)

    }


}


initalize()


const authenticateToken = (request, response, next) => {



    const { authorization } = request.headers




    let jwt;

    if (authorization !== undefined) {

        const jwt = authorization.split(' ')[1]

        if (jwt !== undefined) {

            jsonWebToken.verify(jwt, 'MY_TOKEN', (error, user) => {

                if (user) {

                    next()

                } else {
                    response.send('INVALID JWT TOKEN')
                }

            })





        }

    } else {
        response.send('SEND JWT TOKEN')
    }




}




app.post('/register', async (request, response) => {


    const { body } = request.body

    const { id, name, username, password, email } = body


    const getQuery = `SELECT * FROM user WHERE username = '${username}'`

    const getResult = await db.get(getQuery)

    if (getResult === undefined) {



        const hasedPassword = await bcrypt.hash(password, 10)

        const postQuery = `INSERT INTO user (id,name,username,password,email)
        VALUES
        ( '${id}', '${name}', '${username}', '${hasedPassword}', '${email}');
        `;


        await db.run(postQuery)
        response.send('USER REGISTERED SUCCESSFULLY')



    } else {
        response.send('USER ALREADY EXIST')
    }



})


app.post('/login', async (request, response) => {




    const { body } = request.body

    const { username, password } = body


    const getQuery = `SELECT * FROM user WHERE username = '${username}'`

    const getResult = await db.get(getQuery)



    if (getResult === undefined) {
        response.send('USER NOT FOUND PLEASE REGISTER')
        response.status = 401

    } else {

        const comparePass = await bcrypt.compare(password, getResult.password)
        if (comparePass) {
            const payload = { username: username }

            const jwt = await jsonWebToken.sign(payload, 'MY_TOKEN')

            response.send({ "jwtToken": jwt,CustomerName:getResult.name })




        } else {
            response.send('INVALID PASSWORD')
        }
    }

})


app.get('/toGetData', async (request, response) => {

    const getQUery = `SELECT * FROM products;`

    const result = await db.all(getQUery)
    response.send(result)

})

app.get('/category/:category', async (request, response) => {

    const { category } = request.params

    const { order } = request.query

    const getQuery = `select * from products where category = '${category}' order by price ${order}`

    const result = await db.all(getQuery)

    response.send(result)

})


app.get('/category/:category/:id', async (request, response) => {

    const { category, id } = request.params

    const getQuery = `select * from products where category = '${category}' and id = ${id}`

    const result = await db.get(getQuery)

    response.send(result)

})


const setNewCartForCart = async(request,response,next) =>{
    const {data} = request.body
   
    const { Username } = data
    try {

        const getEachUserCart = `SELECT * FROM ${Username}cart`;
        const eachResult = await db.all(getEachUserCart)
        next()
    } catch (error) {

        try {
            
            const toCreateUserTable = `CREATE TABLE ${Username}cart(id int,title varchar,price int,description text,reviews int,category varchar,name varchar,rating int,image_url varchar,quantity int) `;
            const createResult = await db.run(toCreateUserTable)
        } catch (error) {
        console.log(error)    
        }
        





    }



}

app.post('/postCart', authenticateToken,setNewCartForCart,async (request, response) => {

    const { data } = request.body

    const { id, title, price, description, reviews, category, name, rating, image_url, quantity, Username } = data


        const toGetEachUserCart = `SELECT * FROM ${Username}cart WHERE id = ${id}`
        const getResult = await db.get(toGetEachUserCart)

        if (getResult === undefined) {



            const postQuery = `INSERT INTO ${Username}cart(id,title,price,description,reviews,category,name,rating,image_url,quantity)VALUES
       (${id},"${title}",${price},"${description}",${reviews},"${category}","${name}",${rating},"${image_url}",${quantity})
        `



            const post_result = await db.run(postQuery)

            response.send('ITEM ADDED TO CART')


        } else {
            response.send('ITEM ALREADY ADDED TO CART')
        }










})


app.post('/toGetCart', authenticateToken,setNewCartForCart, async (request, response) => {

    const {data} = request.body

    const {Username} = data

    const getQuery = `SELECT * FROM ${Username}cart`;

    const result = await db.all(getQuery)


    response.send(result)

})

app.post('/toDeleteData/:id', authenticateToken,setNewCartForCart, async (request, response) => {

    const { id } = request.params

    const {data}= request.body

    const {Username} = data

    console.log(id)

    const delete_query = `DELETE FROM ${Username}cart WHERE id = ${id}`
    const result = db.run(delete_query)
    response.send('ITEM DELETED SUCCESSFULY')

})


app.post('/toDeleteAll', authenticateToken, async (request, response) => {

    const {data}= request.body

    const {Username} = data

    const delete_query = `DELETE FROM ${Username}cart;`

    const result = await db.run(delete_query)

    response.send('CART DELETED')

})
