const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const blog = require('../models/blog')

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
            .expect(400)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })

})

describe('deleting a blog', () => {
    test('deleting a blog with valid id', async () => {
        const blogsAtStart = await Blog.find({})
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length - 1)
        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).not.toContain(blogToDelete.title)

    })

    test('deleting a blog with invalid id', async () => {
        const idToDelete = 11

        await api
            .delete(`/api/blogs/${idToDelete}`)
            .expect(400)

        const blogsAtEnd = await Blog.find({})
        expect(blogsAtEnd).toHaveLength(initialBlogs.length)
    })
})

afterAll(async () => {
    await mongoose.connection.close()
})