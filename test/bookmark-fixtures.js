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

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.hackers.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1,
    }
    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousBookmark,
        expectedBookmark
    }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}