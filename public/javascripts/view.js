/* global Handlebars Event Todos */

class View {
  constructor(todos) {
    this.todos = new Todos();

    this.loadTemplates();
    document.body.innerHTML = this.templates.main_template(this.todos);

    // Main area elements
    this.newItem = document.querySelector('label[for="new_item"]');
    this.modalLayer = document.querySelector('#modal_layer');
    this.formModal = document.querySelector('#form_modal');
    this.form = document.querySelector('form');
    this.completeButton = document.querySelector('button[name="complete"]');
    this.items = document.querySelector('#items');
    this.itemsList = document.querySelector('#items tbody');

    // Nav bar elements
    this.sidebar = document.querySelector('#sidebar');
    this.allTodos = document.querySelector('#all_todos');
    this.allLists = document.querySelector('#all_lists');
    this.completedTodos = document.querySelector('#completed_todos');
    this.completedLists = document.querySelector('#completed_lists');

    this.initialRender();
    this.addEventListeners();
  }

  loadTemplates() {
    this.templates = {};
    Array.from(document.querySelectorAll('script[type="text/x-handlebars"]'))
      .forEach(template => {
        let key = template.id;
        this.templates[key] = Handlebars.compile(template.innerHTML);

        if (template.dataset.type === 'partial') {
          Handlebars.registerPartial(key, template.innerHTML);
        }
      });
  }

  initialRender() {
    this.todos.init().then(() => {
      this.renderPage();
    });
  }

  renderPage() {
    this.renderMain();
    this.renderSidebar();
  }

  renderMain() {
    this.items.querySelector('header').innerHTML = this.templates.title_template(this.todos);
    this.itemsList.innerHTML = this.templates.list_template(this.todos);
  }

  renderSidebar() {
    this.allTodos.innerHTML = this.templates.all_todos_template(this.todos);
    this.allLists.innerHTML = this.templates.all_list_template(this.todos);
    this.completedTodos.innerHTML = this.templates.completed_todos_template(this.todos);
    this.completedLists.innerHTML = this.templates.completed_list_template(this.todos);
    this.highlightCurrentSection();
  }

  addEventListeners() {
    this.newItem.addEventListener('click', this.newItemClickListener.bind(this));
    this.modalLayer.addEventListener('click', this.hideForm.bind(this));
    this.form.addEventListener('submit', this.formSubmitListener.bind(this));
    this.itemsList.addEventListener('click', this.itemsListClickListener.bind(this));
    this.itemsList.addEventListener('change', this.itemsListChangeListener.bind(this));
    this.completeButton.addEventListener('click', this.completeButtonClickListener.bind(this));
    this.allTodos.addEventListener('click', this.allTodosClickListener.bind(this));
    this.allLists.addEventListener('click', this.allListsClickListener.bind(this));
    this.completedTodos.addEventListener('click', this.completedTodosClickListener.bind(this));
    this.completedLists.addEventListener('click', this.completedListsClickListener.bind(this));
  }

  newItemClickListener(e) {
    this.form.dataset.id = '';
    this.showForm();
  }

  formSubmitListener(e) {
    e.preventDefault();

    if (this.form.title.value.length < 3) {
      alert('You must enter a title at least 3 characters long.');
      return;
    }

    let data = this.serializeFormData();
    let action;
    if (!this.form.dataset.id) {
      action = this.todos.addTodo(data);
    } else {
      action = this.todos.updateTodo(this.form.dataset.id, data);
    }

    action.then(() => {
      this.hideForm();
      this.renderPage();
    });
  }

  itemsListClickListener(e) {
    e.preventDefault();

    if (e.target.tagName === 'LABEL') {
      let id = e.target.closest('tr').dataset.id;

      this.form.dataset.id = id;
      this.populateForm(this.todos.getTodo(id));
      this.showForm();
    } else if (this.isDeleteElement(e.target)) {
      let id = e.target.closest('tr').dataset.id;

      this.todos.deleteTodo(id).then(() => {
        this.renderPage();
      });
    } else {
      let checkbox = e.target.closest('tr').querySelector('input[type="checkbox"]');
      let changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    }
  }

  itemsListChangeListener(e) {
    let id = e.target.closest('tr').dataset.id;
    let data = JSON.stringify({ completed: !e.target.checked });

    this.todos.updateTodo(id, data).then(() => {
      this.renderPage();
    });
  }

  completeButtonClickListener(e) {
    if (!this.form.dataset.id) {
      alert('Cannot mark as complete as item has not been created yet!');
    } else {
      let id = this.form.dataset.id;
      let selector = `tr[data-id="${id}"] input[type="checkbox"]`;
      let checkbox = this.itemsList.querySelector(selector);

      if (!checkbox.checked) {
        let changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
      }

      this.hideForm();
    }
  }

  allTodosClickListener(e) {
    let group = 'all_items';
    let title = 'All Todos';
    this.changeCurrentSection(group, title);
  }

  allListsClickListener(e) {
    let group = 'all_items';
    let title = e.target.closest('dl').dataset.title;
    this.changeCurrentSection(group, title);
  }

  completedTodosClickListener(e) {
    let group = 'completed_items';
    let title = 'Completed';
    this.changeCurrentSection(group, title);
  }

  completedListsClickListener(e) {
    let group = 'completed_items';
    let title = e.target.closest('dl').dataset.title;
    this.changeCurrentSection(group, title);
  }

  changeCurrentSection(group, title) {
    this.todos.setCurrentSection(group, title);
    this.highlightCurrentSection();
    this.renderMain();
  }

  highlightCurrentSection() {
    let previouslyActive = this.sidebar.querySelector('.active');
    if (previouslyActive) {
      previouslyActive.classList.remove('active');
    }

    let group = this.todos.current_section.group;
    let title = this.todos.current_section.title;
    let element = this.sidebar.querySelector(`#${group} *[data-title="${title}"]`);

    if (element) {
      element.classList.add('active');
    }
  }

  populateForm(todo) {
    let inputs = Array.from(this.form.querySelectorAll('input, select, textarea'));
    inputs.forEach(input => {
      if (input.type !== 'submit') {
        let todoValue = todo[input.name];

        if (input.tagName === 'SELECT') {
          if (todoValue === '00' || todoValue === '0000') {
            input.firstElementChild.setAttribute('selected', '');
          } else {
            Array.from(input.children)
              .filter(option => option.value === todoValue)[0]
              .setAttribute('selected', '');
          }
        } else {
          input.value = todoValue;
        }
      }
    });
  }

  serializeFormData() {
    let data = {};
    let inputs = Array.from(this.form.querySelectorAll('input, select, textarea'));
    inputs.forEach(input => {
      if (input.type !== 'submit') {
        let value = input.value;
        if (input.tagName === 'SELECT' && this.invalidDate(value)) {
          if (input.name === 'day' || input.name === 'month') {
            value = '00';
          } else {
            value = '0000';
          }
        }

        data[input.name] = value;
      }
    });

    return JSON.stringify(data);
  }

  invalidDate(date) {
    return date === 'Day' ||
           date === 'Month' ||
           date === 'Year';
  }

  isDeleteElement(element) {
    return element.closest('td') &&
           element.closest('td').classList.contains('delete');
  }

  showForm() {
    this.modalLayer.style.display = 'block';
    this.formModal.style.display = 'block';
    this.formModal.style.top = '200px';
  }

  hideForm() {
    this.modalLayer.style.display = 'none';
    this.formModal.style.display = 'none';
    this.formModal.style.top = '0';
    this.resetForm();
  }

  resetForm() {
    this.form.reset();
    Array.from(this.form.querySelectorAll('option[selected]')).forEach(option => {
      option.removeAttribute('selected');
    });
  }
}
