function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'First Title',
            url: 'http://www.first.com',
            rating: 1,
            description: 'First test description',
        },
        {
            id: 2,
            title: 'Second Title',
            url: 'http://www.second.com',
            rating: 2,
            description: 'Second test description',
        },
        {
            id: 3,
            title: 'Third Title',
            url: 'http://www.third.com',
            rating: 3,
            description: 'Third test description',
        },
        {
            id: 4,
            title: 'Fourth Title',
            url: 'http://www.fourth.com',
            rating: 4,
            description: 'Fourth test description',
        },
    ]
}

module.exports = {
    makeBookmarksArray,
}