const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    const body = request.body
    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    if (body.title && body.url) {
        const savedBlog = await blog.save()
        response.status(201).json(savedBlog)
    } else response.status(400).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        id: body.id
    }

    try {
        await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        response.status(200).json(blog)
    } catch (error) {
        next(error)
    }
})

blogsRouter.delete('/:id', async (request, response, next) => {
    try {
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    } catch (error) {
        next(error)
    }
})

module.exports = blogsRouter