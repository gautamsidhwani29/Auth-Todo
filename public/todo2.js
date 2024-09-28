const input = document.querySelector("#ipbox");
const ul = document.querySelector("ul");
const btn = document.querySelector(".btn");

const addTask = async (task) => {
    if (!task) {
        alert("Add a valid Task");
        return;
    }

    const taskElement = document.createElement('li');
    const taskContent = document.createElement('span');
    taskContent.innerText = task;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
    deleteBtn.classList.add("delete", "btn");
    deleteBtn.addEventListener('click', () => {
        taskElement.remove();
    });

    taskElement.appendChild(taskContent);
    taskElement.appendChild(deleteBtn);
    ul.appendChild(taskElement);

    const response = await axios.get('/authorized');
    const userId = response.data.user.id;
    await axios.post('/addtodo', { title: task, userId });

    input.value = "";
}

const renderTasks = async (todo,todoId) => {
    const taskElement = document.createElement('li');
    const taskContent = document.createElement('span');
    taskContent.innerText = todo.title;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
    deleteBtn.classList.add("delete", "btn");
    deleteBtn.addEventListener('click', () => {
        taskElement.remove();
    });

    taskElement.appendChild(taskContent);
    taskElement.appendChild(deleteBtn);
    ul.appendChild(taskElement);
}

const getTodos = async () => {
    try {
        const response = await axios.get('/gettodos');
        const todos = response.data.todos;
        todos.forEach(todo => renderTasks(todo));
    } catch (e) {
        console.log("Error fetching todos", e);
    }
};

getTodos();

btn.addEventListener('click', () => {
    addTask(input.value);
});

input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTask(input.value);
    }
});
