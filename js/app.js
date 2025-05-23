document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employeeForm');
    const tableBody = document.querySelector('#employeeTable tbody');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const submitButton = form.querySelector('button[type="submit"]');

    let isEditing = false;
    let currentEditId = null;
    let employees = [];

    const regexPatterns = {
        name: /^[A-Za-z\s]{3,50}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        salary: /^\d+$/
    };

    function loadEmployees() {
        fetch('http://localhost:3000/employees')
            .then(res => res.json())
            .then(data => {
                employees = data;
                renderTable(employees);
            })
            .catch(err => console.error('❌ Error fetching data:', err));
    }

    function renderTable(data) {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="5" style="text-align:center;">No employees found.</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }

        data.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.email}</td>
                <td>${employee.salary}</td>
                <td>${employee.department}</td>
                <td>
                    <button data-id="${employee.id}" class="edit-btn">Edit</button>
                    <button data-id="${employee.id}" class="delete-btn">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachDeleteHandlers();
        attachEditHandlers();
    }

    function filterEmployees(query) {
        const q = query.trim().toLowerCase();
        if (!q) return employees;

        return employees.filter(emp =>
            emp.name.toLowerCase().includes(q) ||
            emp.email.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q)
        );
    }

    function sortEmployees(data, sortKey) {
        if (!sortKey) return data;

        let sorted = [...data];

        if (sortKey === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortKey === 'salary') {
            sorted.sort((a, b) => a.salary - b.salary);
        }

        return sorted;
    }

    searchInput.addEventListener('input', () => {
        const filtered = filterEmployees(searchInput.value);
        const sorted = sortEmployees(filtered, sortSelect.value);
        renderTable(sorted);
    });

    sortSelect.addEventListener('change', () => {
        const filtered = filterEmployees(searchInput.value);
        const sorted = sortEmployees(filtered, sortSelect.value);
        renderTable(sorted);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = form.name.value.trim();
        const email = form.email.value.trim().toLowerCase();
        const salary = form.salary.value.trim();
        const department = form.department.value;

        if (!regexPatterns.name.test(name)) {
            alert('❌ Invalid name. Only letters and spaces allowed (3-50 chars).');
            return;
        }
        if (!regexPatterns.email.test(email)) {
            alert('❌ Invalid email format.');
            return;
        }
        if (!regexPatterns.salary.test(salary) || parseInt(salary) < 1000) {
            alert('❌ Salary must be a number greater or equal to 1000.');
            return;
        }
        if (!department) {
            alert('❌ Please select a department.');
            return;
        }

        const employeeData = {
            name,
            email,
            salary: parseInt(salary),
            department
        };

        const duplicate = employees.find(emp =>
            emp.email.toLowerCase() === email && emp.id !== currentEditId
        );
        if (duplicate) {
            alert('❌ An employee with this email already exists!');
            return;
        }

        if (isEditing) {
            fetch(`http://localhost:3000/employees/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to update');
                    return res.json();
                })
                .then(() => {
                    alert('✅ Employee updated!');
                    resetForm();
                    loadEmployees();
                })
                .catch(err => {
                    console.error('❌ Error updating employee:', err);
                    alert('❌ Error updating employee.');
                });
        } else {
            fetch('http://localhost:3000/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to add');
                    return res.json();
                })
                .then(() => {
                    alert('✅ Employee added!');
                    form.reset();
                    loadEmployees();
                })
                .catch(err => {
                    console.error('❌ Error adding employee:', err);
                    alert('❌ Error adding employee.');
                });
        }
    });

    function attachDeleteHandlers() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this employee?')) {
                    fetch(`http://localhost:3000/employees/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to delete');
                            loadEmployees();
                        })
                        .catch(err => {
                            console.error('❌ Error deleting employee:', err);
                            alert('❌ Error deleting employee.');
                        });
                }
            });
        });
    }

    function attachEditHandlers() {
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                fetch(`http://localhost:3000/employees/${id}`)
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to fetch employee');
                        return res.json();
                    })
                    .then(data => {
                        form.name.value = data.name;
                        form.email.value = data.email;
                        form.salary.value = data.salary;
                        form.department.value = data.department;

                        isEditing = true;
                        currentEditId = id;
                        submitButton.textContent = 'Update Employee';
                    })
                    .catch(err => {
                        console.error('❌ Error loading employee for edit:', err);
                        alert('❌ Error loading employee data.');
                    });
            });
        });
    }

    function resetForm() {
        form.reset();
        isEditing = false;
        currentEditId = null;
        submitButton.textContent = 'Add Employee';
    }

    loadEmployees();
});
