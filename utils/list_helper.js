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

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}