const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmark-fixtures');

describe('Bookmark Endpoints', () => {
    let db;

    before('create knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });

    after('disconnect from db', () => db.destroy());

    before('clean the table', () => db('bookmarks').truncate());

    afterEach(`clean the table`, () => db('bookmarks').truncate());

    describe(`Unauthorized requests`, () => {
        const testBookmarks = makeBookmarksArray();

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        });

        it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(401, {
                    error: 'Unauthorized request'
                })
        });

        it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
            return supertest(app)
                .post('/bookmarks')
                .expect(401, {
                    error: 'Unauthorized request'
                })
        });

        it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
            const secondBookmark = testBookmarks[1]
            return supertest(app)
                .get(`/bookmarks/${secondBookmark.id}`)
                .expect(401, {
                    error: 'Unauthorized request'
                })
        });

        it(`responds with 401 Unauthorized for DELETE /bookmarks/:id`, () => {
            const secondBookmark = testBookmarks[1]
            return supertest(app)
                .delete(`/bookmarks/${secondBookmark.id}`)
                .expect(401, {
                    error: 'Unauthorized request'
                })
        });
    })

    describe(`GET /bookmarks endpoint`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty array`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            });
        });

        context(`Given an array of bookmarks`, () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('gets the bookmarks from the array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/bookmarks`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            });
        });
    });

    describe(`GET /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404 and 'Bookmark not found'`, () => {
                return supertest(app)
                    .get(`/bookmarks/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Bookmark Not Found` }
                    })
            });
        });

        context(`Given an array of bookmarks`, () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach(`insert bookmarks`, () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            });

            it(`responds with 200 and specified bookmark`, () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            });

            it(`removes the XSS attack content`, () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    });

    describe(`DELETE /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds 404 when bookmark doesn't exist`, () => {
                return supertest(app)
                    .delete(`/bookmarks/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Bookmark Not Found` }
                    })
            })
        });

        context(`Given there are bookmarks in the db`, () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            });
    
            it(`removes the bookmark by ID from db`, () => {
                const idToRemove= 3
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/bookmarks')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    })
            })
        })
    })

    describe(`POST /bookmarks`, () => {
        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'https://www.test.com',
                rating: 1,
            }
            
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: { message: `'${field}' is required`}
                    })
            });
        });

        it(`responds with 400 invalid 'rating' if not between 1 and 5`, () => {
            const newBookmarkInvalidRating = {
                title: 'test-title',
                url: 'https://www.test.com',
                rating: 'invalid',
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkInvalidRating)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'rating' must be a number between 1 and 5`}
                })
        });

        it(`adds a new bookmark to db`, () => {
            const newBookmark = {
                title: 'Test title',
                url: 'https://www.test.com',
                description: 'test description',
                rating: 1,
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(res => {
                    return supertest(app)
                        .get(`/bookmarks/${res.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(res.body)      
                })
        })

        it(`removes XSS attack content from response`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
            return supertest(app)
                .post('/bookmarks')
                .send(maliciousBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201) 
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description) 
                })

        });
    })
});