document.getElementById('addButton')?.addEventListener('click', () => {
    const popup = document.getElementById('addTransactionPopup');
    if (popup) {
        popup.classList.remove('hidden');
    }
});

document.querySelectorAll('.type-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        const popup = document.getElementById('addTransactionPopup');
        if (popup) {
            popup.classList.add('hidden');
        }

        if (type === 'expense') {
            showForm('expenseFormPopup');
        } else if (type === 'income') {
            showForm('incomeFormPopup');
        }
    });
});

function showForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.classList.remove('hidden');
    }
}

document.getElementById('closeExpenseForm')?.addEventListener('click', () => closeForm('expenseFormPopup'));
document.getElementById('closeIncomeForm')?.addEventListener('click', () => closeForm('incomeFormPopup'));

function closeForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.classList.add('hidden');
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-GB', options); 
}

function updateTransactionList(transaction) {
    const transactionList = document.getElementById('transactionList');
    const transactionItem = document.createElement('div');
    transactionItem.classList.add('transaction-item');
    transactionItem.setAttribute('data-type', transaction.type); 

    const shortDescription = transaction.description && transaction.description.length > 20 
        ? transaction.description.slice(0, 20) 
        : transaction.description;

    transactionItem.innerHTML = `
        <div class="date">${formatDate(transaction.date)}</div>
        <div class="details">
            <span>${transaction.name}</span>
            <select>
                <option selected>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</option>
            </select>
            <span class="description">${shortDescription}</span>
            <i class="fa fa-ellipsis-h toggle-description"></i>
        </div>
        <div class="amount ${transaction.type === 'expense' ? 'negative' : 'positive'}">LKR ${transaction.amount}</div>
        <div class="actions">
            <button class="edit-btn"><i class="fa fa-pencil" aria-hidden="true"></i></button>
            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;

    transactionList.appendChild(transactionItem);

    const deleteButton = transactionItem.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => {
        transactionItem.remove();
    });

    const editButton = transactionItem.querySelector('.edit-btn');
    editButton.addEventListener('click', () => handleEdit(transactionItem, transaction));

    const toggleButton = transactionItem.querySelector('.toggle-description');
    const descriptionSpan = transactionItem.querySelector('.description');
    
    let isExpanded = false;
    
    toggleButton.addEventListener('click', () => {
        isExpanded = !isExpanded; 
        if (isExpanded) {
            descriptionSpan.textContent = transaction.description;
            descriptionSpan.classList.add('expanded');
        } else {
            descriptionSpan.textContent = shortDescription;
            descriptionSpan.classList.remove('expanded');
        }
    });
}

function handleEdit(transactionItem, transaction) {
    // Creating an editing form
    const editForm = document.createElement('form');
    editForm.id = 'editTransactionForm';
    editForm.innerHTML = `
        <label for="editName">Transaction Name:</label>
        <input type="text" id="editName" value="${transaction.name}" required>
        <label for="editAmount">Amount:</label>
        <input type="number" id="editAmount" value="${transaction.amount}" required>
        <label for="editDate">Date:</label>
        <input type="date" id="editDate" value="${transaction.date}" required>
        <button type="submit">Update Transaction</button>
        <button type="button" id="closeEditForm">Cancel</button>
    `;

   
    transactionItem.innerHTML = ''; 
    transactionItem.appendChild(editForm);

   
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = editForm.editName.value;
        const newAmount = editForm.editAmount.value;
        const newDate = editForm.editDate.value;

        if (newName && newAmount && newDate) {
            transactionItem.innerHTML = `
                <div class="date">${formatDate(newDate)}</div>
                <div class="details">
                    <span>${newName}</span>
                    <select>
                        <option selected>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</option>
                    </select>
                    <span class="description">${transaction.description}</span>
                </div>
                <div class="amount ${transaction.type === 'expense' ? 'negative' : 'positive'}">LKR ${newAmount}</div>
                <div class="actions">
                    <button class="edit-btn"><i class="fa fa-pencil" aria-hidden="true"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            updateTransactionList({ ...transaction, name: newName, amount: newAmount, date: newDate });
        }
    });


    document.getElementById('closeEditForm').addEventListener('click', () => {
        transactionItem.innerHTML = `
            <div class="date">${formatDate(transaction.date)}</div>
            <div class="details">
                <span>${transaction.name}</span>
                <select>
                    <option selected>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</option>
                </select>
                <span class="description">${transaction.description}</span>
            </div>
            <div class="amount ${transaction.type === 'expense' ? 'negative' : 'positive'}">LKR ${transaction.amount}</div>
            <div class="actions">
                <button class="edit-btn"><i class="fa fa-pencil" aria-hidden="true"></i></button>
                <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
    });
}

function filterTransactions(filterType) {
    const transactions = document.querySelectorAll('.transaction-item');
    transactions.forEach(transaction => {
        const transactionType = transaction.getAttribute('data-type');
        if (filterType === 'all' || transactionType === filterType) {
            transaction.style.display = 'flex'; 
        } else {
            transaction.style.display = 'none';  
        }
    });
}

document.getElementById('expenseForm')?.addEventListener('submit', handleSubmit);
document.getElementById('incomeForm')?.addEventListener('submit', handleSubmit);

function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.type = form.id.replace('Form', '').toLowerCase();
    data.type = data.type.charAt(0).toUpperCase() + data.type.slice(1);

    fetch('http://localhost:3000/add-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            if (result.message === 'Transaction added successfully') {
                alert('Transaction added successfully!');
                updateTransactionList(data); 
                closeForm(form.parentElement.parentElement.id); 
                form.reset(); 
            } else {
                alert('Failed to add the transaction. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add the transaction. Please try again.');
        });
}

document.getElementById('transactionFilter')?.addEventListener('change', (e) => {
    const selectedFilter = e.target.value;
    filterTransactions(selectedFilter);
});

document.getElementById('sortBy')?.addEventListener('change', (e) => {
    const sortOption = e.target.value;
    sortTransactions(sortOption);
});

function sortTransactions(sortBy) {
    const transactionList = document.getElementById('transactionList');
    const transactions = Array.from(transactionList.getElementsByClassName('transaction-item'));

    transactions.sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = new Date(a.querySelector('.date').textContent.trim());
            const dateB = new Date(b.querySelector('.date').textContent.trim());
            return dateA - dateB; 
        } else if (sortBy === 'amount') {
            const amountA = parseFloat(a.querySelector('.amount').textContent.replace(/[^0-9.-]+/g, ''));
            const amountB = parseFloat(b.querySelector('.amount').textContent.replace(/[^0-9.-]+/g, ''));
            return amountA - amountB;
        }
    });

    transactions.forEach(transaction => transactionList.appendChild(transaction));
}

deleteButton.addEventListener('click', () => {
    console.log("Delete button clicked!"); 
    transactionItem.remove(); 
});

