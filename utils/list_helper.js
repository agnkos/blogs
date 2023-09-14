var _ = require('lodash');
const array = require('lodash/array');

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (acc, curr) => {
        return acc + curr.likes
    }

    return blogs.reduce(reducer, 0)
}

const favoriteBlog = blogs => {
    const reducer = (acc, curr) => {
        return acc.likes > curr.likes ? acc : curr
    }
    if (blogs.length !== 0) {
        const blog = blogs.reduce(reducer)

        return {
            title: blog.title,
            author: blog.author,
            likes: blog.likes,
        }
    } else return 'the blog list is empty'
}

const mostBlogs = blogs => {
    let authorData = _.maxBy(_.entries(_.countBy(blogs, 'author')))

    return blogs.length === 0 ? 'the blog list is empty' : {
        author: authorData[0],
        blogs: authorData[1]
    }
}

const mostLikes = blogs => {
    let groupedAuthors = _.groupBy(blogs, 'author')

    let authorsLikes = _.map(_.entries(groupedAuthors), function (el) {
        const reducer = (acc, curr) => {
            return acc + curr.likes
        }
        return { author: el[0], likes: el[1].reduce(reducer, 0) }
    })

    return blogs.length === 0 ? 'the blog list is empty' : _.maxBy(authorsLikes, 'likes')
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}