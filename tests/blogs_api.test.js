const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')

const initialBlogs = [
    {
        _id: "5a422a851b54a676234d17f7",
        title: "React patterns",
        author: "Michael Chan",
        url: "https://reactpatterns.com/",
        likes: 7,
        __v: 0
    },
    {
        _id: "5a422aa71b54a676234d17f8",
        title: "Go To Statement Considered Harmful",
        author: "Edsger W. Dijkstra",
        url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
        likes: 5,
        __v: 0
    },
    {
        _id: "5a422b3a1b54a676234d17f9",
        title: "Canonical string reduction",
        author: "Edsger W. Dijkstra",
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
        likes: 12,
        __v: 0
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('all blog are returned in json format', async () => {
    const response = await api.get('/api/blogs')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toHaveLength(initialBlogs.length)
}, 100000)

test('all ids are defined', async () => {
    const response = await api.get('/api/blogs')
    const idArray = response.body.map(blog => blog.id)
    idArray.forEach(id => expect(id).toBeDefined())
})

describe('adding a blog', () => {

    let token;

    beforeEach(async () => {
        await api
            .post('/api/users')
            .send(helper.initialUsers[0])

        const userResponse = await api
            .post('/api/login')
            .send(helper.initialUsers[0])

        token = userResponse.body.token
    })

    test('a blog with full info is added', async () => {
        const newBlog = {
            title: "New Blog Title",
            author: "New author",
            url: "www.newblog.com",
            likes: 11
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length + 1)
        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).toContain('New Blog Title')
    })

    test('a blog without likes property is added and likes default to 0', async () => {
        const newBlog = {
            title: "Blog with no likes",
            author: "Author with no likes",
            url: "www.nolikes.com"
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length + 1)
        const blogWithoutLikes = blogsAtEnd.find(blog => blog.title === "Blog with no likes")
        expect(blogWithoutLikes.likes).toBe(0)
    })

    test('status code 400 when a blog without title is added', async () => {
        const newBlog = {
            author: 'Author',
            url: 'blogwithonotitle.com',
            likes: 6
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })

    test('status code 400 when a blog without url is added', async () => {
        const newBlog = {
            title: 'Blog without url',
            author: 'Author',
            likes: 6
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })

    test('adding a blog fails when token is not provided', async () => {
        const newBlog = {
            title: "New Blog Title",
            author: "New author",
            url: "www.newblog.com",
            likes: 11
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer `)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })

})

test('updating a blog', async () => {
    const blogsAtStart = await Blog.find({})
    const blogsAtStartJson = blogsAtStart.map(blog => blog.toJSON())
    const blogToUpdate = { ...blogsAtStartJson[0], likes: 50 }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await Blog.find({})
    expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    const blogLikes = blogsAtEnd[0].likes
    expect(blogLikes).toBe(50)
})

describe('deleting a blog', () => {

    let token;

    beforeEach(async () => {
        const userCreated = await api
            .post('/api/users')
            .send(helper.initialUsers[0])

        const userResponse = await api
            .post('/api/login')
            .send(helper.initialUsers[0])

        token = userResponse.body.token
    })

    test('deleting a blog with valid id by the author', async () => {

        const newBlog = {
            title: "New Blog Title",
            author: "New author",
            url: "www.newblog.com",
            likes: 11
        }

        const blogPosted = await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogId = blogPosted.body.id

        const blogsAtMiddle = await Blog.find({})

        await api
            .delete(`/api/blogs/${blogId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(blogsAtMiddle.length - 1)
        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).not.toContain(blogPosted.body.title)

    })

    test('code status 401 when deleting a blog with valid id by the wrong author', async () => {
        const blogsAtStart = await Blog.find({})

        const newBlog = {
            title: "New Blog Title",
            author: "New author",
            url: "www.newblog.com",
            likes: 11
        }

        const blogPosted = await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogId = blogPosted.body.id

        await api
            .delete(`/api/blogs/${blogId}`)
            .set('Authorization', `Bearer 213213234234`)
            .expect(401)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1)
        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).toContain(blogPosted.body.title)

    })

    test('deleting a blog with invalid id', async () => {
        const idToDelete = 11

        await api
            .delete(`/api/blogs/${idToDelete}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'Aga',
            name: 'Aga',
            password: '1234',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Aga',
            password: 'piotrek8',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)

        expect(result.body.error).toContain('username is already existing in database')


        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails with proper statuscode and message if username is missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const userWithoutUsername = {
            password: '1234',
            name: 'Piotrek',
        }

        const result = await api
            .post('/api/users')
            .send(userWithoutUsername)
            .expect(400)

        expect(result.body.error).toContain('username and password are required')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails with proper statuscode and message if password is missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const userWithoutPassword = {
            username: 'Piotrek',
            name: 'Piotrek',
        }

        const result = await api
            .post('/api/users')
            .send(userWithoutPassword)
            .expect(400)

        expect(result.body.error).toContain('username and password are required')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails with proper statuscode and message if username is less than 3 characters long', async () => {
        const usersAtStart = await helper.usersInDb()

        const shortUsername = {
            username: 'ag',
            name: 'Aga',
            password: 'piotrek8',
        }

        const result = await api
            .post('/api/users')
            .send(shortUsername)
            .expect(400)

        expect(result.body.error).toContain('username and password must be at least 3 characters long')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)

    })

    test('creation fails with proper statuscode and message if password is less than 3 characters long', async () => {
        const usersAtStart = await helper.usersInDb()

        const shortPassword = {
            username: 'aga',
            name: 'Aga',
            password: 'pi',
        }

        const result = await api
            .post('/api/users')
            .send(shortPassword)
            .expect(400)

        expect(result.body.error).toContain('username and password must be at least 3 characters long')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)

    })
})

afterAll(async () => {
    await mongoose.connection.close()
})