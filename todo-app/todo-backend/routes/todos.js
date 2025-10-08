const express = require('express');
const { Todo } = require('../mongo');
const { setAsync, getAsync } = require('../redis');
const router = express.Router();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

// ✅ Moved this block up
router.get('/statistics', async (_, res) => {
  const metadata = Number(await getAsync('added_todos') || 0);
  console.log('metadata: ', metadata);
  res.json({ added_todos: Number(metadata) });
});

//polish
router.get('/:id', async (req, res) => {
  const todo = await Todo.find({ _id: req.params.id })
  res.send(todo);
});

router.put('/:id', async (req, res) => {
  const updatedTodo = await Todo.findById(req.params.id);
  req.body.text && (updatedTodo.text = req.body.text);
  req.body.done && (updatedTodo.done = req.body.done);
  await updatedTodo.save();
  res.send(updatedTodo);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  let count = Number(await getAsync('added_todos')) || 0;
  console.log('count before add: ', count);
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })
  count++;
  console.log('count after add: ', count);

  setAsync('added_todos', count)
  res.json({ added_todos: Number(count) });
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.sendStatus(405); // Implement this
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  res.sendStatus(405); // Implement this
});

router.use('/:id', findByIdMiddleware, singleRouter)

module.exports = router;
