/* global APIHandler */

class Todos {
  constructor () {
    this.api = new APIHandler();
    this.todos = [];
    this.current_section = {};
  }

  getTodo(id) {
    return this.todos.filter(todo => String(todo.id) === id)[0];
  }

  addTodo(todo) {
    return this.api.postTodo(todo).then(todo => {
      if (todo.error) {
        alert(todo.error);
      } else {
        this.updateDueDate(todo);
        this.todos.push(todo);
        this.current_section = {
          group: 'all_items',
          title: 'All Todos',
        };
        this.updateCollections();
      }
    });
  }

  deleteTodo(id) {
    return this.api.deleteTodo(id).then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        this.todos = this.todos.filter(todo => String(todo.id) !== id);
        this.updateCollections();
      }
    });
  }

  updateTodo(id, newTodo) {
    return this.api.putTodo(id, newTodo).then(newTodo => {
      if (newTodo.error) {
        alert(newTodo.error);
      } else {
        let oldTodo = this.getTodo(id);
        this.copyProperties(oldTodo, newTodo);
        this.updateDueDate(oldTodo);
        this.updateCollections();
      }
    });
  }

  updateCollections() {
    this.sortByDates(this.todos);
    this.updateDoneTodos();
    this.updateTodosByDate();
    this.updateDoneTodosByDate();
    this.updateSelected();
    this.sortByCompleted(this.selected);
    this.current_section.data = this.selected.length;
  }

  updateDueDate(todo) {
    if (todo.month !== '00' && todo.year !== '0000') {
      todo.due_date = todo.month + '/' + todo.year.slice(2);
    } else {
      todo.due_date = 'No Due Date';
    }
  }

  formatTodos(todos) {
    return todos.map(todo => {
      this.updateDueDate(todo);
      return todo;
    });
  }

  updateDoneTodos() {
    this.done = this.todos.filter(todo => todo.completed);
  }

  updateTodosByDate() {
    this.todos_by_date = {};
    this.todos.forEach(todo => {
      this.todos_by_date[todo.due_date] = this.todos_by_date[todo.due_date] || [];
      this.todos_by_date[todo.due_date].push(todo);
    });
  }

  updateDoneTodosByDate() {
    this.done_todos_by_date = {};
    this.done.forEach(todo => {
      this.done_todos_by_date[todo.due_date] = this.done_todos_by_date[todo.due_date] ||
                                              [];
      this.done_todos_by_date[todo.due_date].push(todo);
    });
  }

  updateSelected() {
    let group = this.current_section.group;
    let title = this.current_section.title;

    if (group === 'all_items') {
      if (title === 'All Todos') {
        this.selected = Array.from(this.todos);
      } else {
        this.selected = Array.from(this.todos_by_date[title] || []);
      }
    } else if (group === 'completed_items') {
      if (title === 'Completed') {
        this.selected = Array.from(this.done);
      } else {
        this.selected = Array.from(this.done_todos_by_date[title] || []);
      }
    }
  }

  sortByCompleted(collection) {
    collection.sort((a, b) => {
      if (a.completed && !b.completed) {
        return 1;
      } else if (!a.completed && b.completed) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  setCurrentSection(group, title) {
    this.current_section.group = group;
    this.current_section.title = title;
    this.updateSelected();
    this.sortByCompleted(this.selected);
    this.current_section.data = this.selected.length;
  }

  sortByDates(collection) {
    collection.sort((a, b) => {
      return this.compareDates(a.due_date, b.due_date);
    });
  }

  copyProperties(target, collection) {
    Object.keys(collection).forEach(key => {
      target[key] = collection[key];
    });
  }

  compareDates(a, b) {
    if (a === b) {
      return 0;
    } else if (a === 'No Due Date') {
      return -1;
    } else if (b === 'No Due Date') {
      return 1;
    } else if (this.year(a) !== this.year(b)) {
      return this.year(a) - this.year(b);
    } else {
      return this.month(a) - this.month(b);
    }
  }

  year(date) {
    return Number(date.slice(3));
  }

  month(date) {
    return Number(date.slice(0, 2));
  }

  init() {
    return this.api.getAllTodos().then(todos => {
      this.todos = this.formatTodos(todos);
      this.current_section = {
        group: 'all_items',
        title: 'All Todos',
      };
      this.updateCollections();
    });
  }
}
