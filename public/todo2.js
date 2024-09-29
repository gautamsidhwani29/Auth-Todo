const input = document.querySelector("#ipbox");
const ul = document.querySelector("ul");
const btn = document.querySelector(".btn");

const addTask = async (task) => {
    if (!task) {
        alert("Add a valid Task");
        return;
    }

    try {
        const response = await axios.get('/authorized');
        const user = response.data.userDetails;
        const userId = user.id;

        const addTodoResponse = await axios.post('/addtodo', { title: task, userId });
        const todoId = addTodoResponse.data.response._id;

        renderTask(todoId, task, false);
        input.value = "";
    } catch (error) {
        console.error("Error adding task:", error);
    }
};

const renderTask = (todoId, title, isCompleted) => {
    const taskElement = document.createElement('li');
    const taskContent = document.createElement('span');
    taskContent.innerText = title;

    if (isCompleted) {
        taskElement.classList.add('checked');
    }

    taskElement.setAttribute('data-id', todoId);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
    deleteBtn.classList.add("delete", "btn");

    deleteBtn.addEventListener('click', async () => {
        try {
            await axios.delete('/deletetodo', { data: { todoId } });
            taskElement.remove();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    });

    taskElement.addEventListener('click', async () => {
        const checked = taskElement.classList.toggle('checked');
        try {
            await axios.put('/updatetodo', { todoId, checked });
            console.log(checked ? 'The item is now checked' : 'The item is now unchecked');
        } catch (error) {
            console.error("Error updating task:", error);
        }
    });

    taskElement.appendChild(taskContent);
    taskElement.appendChild(deleteBtn);
    ul.appendChild(taskElement);
};

const getTodos = async () => {
    try {
        const response = await axios.get('/gettodos');
        const todos = response.data.todos;
        todos.forEach(todo => renderTask(todo._id, todo.title, todo.isCompleted));
    } catch (e) {
        console.log("Error fetching todos", e);
    }
};

btn.addEventListener('click', () => {
    addTask(input.value);
});

input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTask(input.value);
    }
});

getTodos();
