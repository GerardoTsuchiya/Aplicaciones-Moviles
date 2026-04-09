const request = require('supertest');
const app = require('./index');

describe('PATCH /todo/:id', () => {
    test('updates title of an existing todo', async () => {
        const res = await request(app)
            .patch('/todo/1')
            .send({ title: 'Comprar pan' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(200);
        expect(res.body.message).toBe('Todo updated');
        expect(res.body.data.id).toBe(1);
        expect(res.body.data.title).toBe('Comprar pan');
    });

    test('trims whitespace from title', async () => {
        const res = await request(app)
            .patch('/todo/1')
            .send({ title: '  Comprar pan  ' });

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Comprar pan');
    });

    test('returns 404 when todo does not exist', async () => {
        const res = await request(app)
            .patch('/todo/999')
            .send({ title: 'Algo' });

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(404);
        expect(res.body.message).toBe('Todo not found');
    });

    test('returns 400 when title is missing', async () => {
        const res = await request(app)
            .patch('/todo/1')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(400);
        expect(res.body.message).toBe('Title is required');
    });

    test('returns 400 when title is blank', async () => {
        const res = await request(app)
            .patch('/todo/1')
            .send({ title: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(400);
        expect(res.body.message).toBe('Title is required');
    });

    test('ignores fields other than title', async () => {
        const res = await request(app)
            .patch('/todo/2')
            .send({ title: 'Nueva tarea', completed: false });

        expect(res.status).toBe(200);
        expect(res.body.data.completed).toBe(true); // original value preserved
    });
});

describe('DELETE /todo/:id', () => {
    test('deletes an existing todo and returns it', async () => {
        const res = await request(app)
            .delete('/todo/2');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(200);
        expect(res.body.message).toBe('Todo deleted');
        expect(res.body.data.id).toBe(2);
    });

    test('returns 404 when todo does not exist', async () => {
        const res = await request(app)
            .delete('/todo/999');

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(404);
        expect(res.body.message).toBe('Todo not found');
    });

    test('returns 404 for non-numeric id', async () => {
        const res = await request(app)
            .delete('/todo/abc');

        expect(res.status).toBe(404);
    });
});
