/* global fetch */

class APIHandler {
  async getAllTodos() {
    try {
      let request = await fetch('/api/todos');
      return request.json();
    } catch {
      return Promise.reject('A network error has occurred.');
    }
  }

  async postTodo(data) {
    try {
      let options = {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      let request = await fetch('/api/todos', options);
      if (request.status === 201) {
        return request.json();
      } else if (request.status === 400) {
        let error = await request.text();
        return { error };
      }
    } catch {
      return Promise.reject('A network error has occurred.');
    }
  }

  async deleteTodo(id) {
    try {
      let options = {
        method: 'DELETE',
      };

      let request = await fetch(`/api/todos/${id}`, options);
      if (request.status === 204) {
        return { success: true };
      } else if (request.status === 404) {
        let error = await request.text();
        return { error };
      }
    } catch {
      return Promise.reject('A network error has occurred.');
    }
  }

  async putTodo(id, data) {
    try {
      let options = {
        method: 'PUT',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      let request = await fetch(`/api/todos/${id}`, options);
      if (request.status === 200) {
        return request.json();
      } else {
        let error = await request.text();
        return { error };
      }
    } catch {
      return Promise.reject('A network error has occurred.');
    }
  }
}
