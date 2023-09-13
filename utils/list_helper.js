const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (acc, curr) => {
        return acc + curr.likes
    }

    return blogs.reduce(reducer, 0)
}


module.exports = {
    dummy,
    totalLikes,
}