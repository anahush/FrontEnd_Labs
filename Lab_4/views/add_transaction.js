import DateTimeConvert from "../services/dateTimeConvert.js";
import DatabaseUtils from "../services/databaseUtils.js";
import ShortStatisticsPartial from "./shortStatisticsPartial.js";

let AddTransaction = {
    render: async (dataStatistics) => {
        AddTransaction.dataStatistics = dataStatistics;
        return `
        <div class="site-content">
        ${AddTransaction.renderAside()}

        <main class="add-transaction">
            <div class="container-transaction">
                <div class="wrap-transaction">
                    <form class="transaction-form" id="add-transaction-form">
                        <div class="wrap-input validate-input" data-validate="Description is required">
                            <label class="label-input" for="description-transaction">Description</label>
                            <input class="input input-form" type="text" id="description-transaction" name="description"
                                placeholder="Enter description" required>
                            <span class="focus-input"></span>
                        </div>
                        <div class="wrap-input validate-input" data-validate="Amount is required">
                            <label class="label-input" for="amount-transaction">Amount</label>
                            <input class="input input-form" id="amount-transaction" type="number" name="amount"
                                placeholder="Enter amount" required>
                            <span class="focus-input"></span>
                        </div>
                        <div class="wrap-input input-select">
                            <label class="label-input" for="type-transaction">Type</label>
                            <div>
                                <select class="select-transaction" id="type-transaction" name="type">
                                    <option>Income</option>
                                    <option>Expense</option>
                                </select>
                            </div>
                        </div>
                        <div class="wrap-input input-select">
                            <label class="label-input" for="currency-transaction">Currency</label>
                            <div>
                                <select class="select-transaction" id="currency-transaction" name="currency">
                                    <option>USD</option>
                                    <option>EUR</option>
                                    <option>BYN</option>
                                    <option>RUB</option>
                                </select>
                            </div>
                        </div>
                        <div class="wrap-input input-select">
                            <label class="label-input" for="category-transaction">Category</label>
                            <div>
                                <select class="select-transaction" id="category-transaction" name="category">
                                    <option>Food</option>
                                    <option>Transport</option>
                                    <option>Car</option>
                                    <option>Entertainment</option>
                                    <option>Clothes</option>
                                    <option>House</option>
                                </select>
                            </div>
                        </div>
                        <div class="wrap-input input-date">
                            <label class="label-input" for="date-transaction">Date</label>
                            <input class="input date-input" id="date-transaction" type="date" name="date" required>
                        </div>
                        <div class="wrap-input input-select">
                            <label class="label-input" for="account-transaction">Account</label>
                            <div>
                                <select class="select-transaction" id="account-transaction" name="account">
                                    <option>Card</option>
                                    <option>Cash</option>
                                </select>
                            </div>
                        </div>
                        <div class="wrap-input">
                            <label class="label-input" for="place-transaction">Place</label>
                            <input class="input input-form" id="place-transaction" type="text" name="place"
                                placeholder="Enter place">
                            <span class="focus-input"></span>
                        </div>
                        <div class="wrap-input">
                            <label class="label-input" for="image-transaction">Image</label>
                            <input class="input-file" id="image-transaction" type="file" accept="image/*" name="image" class="input-file"
                                placeholder="Upload image">
                            <label for="image-transaction" class="btn btn-tertiary js-labelFile" id="button-input-file">
                                <img class="upload" id="upload-picture" src="res/upload.png">
                                <span class="js-fileName" id="file-name">Загрузить файл</span>
                            </label>
                        </div>
                        <div class="buttons">
                            <input type="submit" name="Submit" class="transaction-submit">
                            <a class="transaction-submit cancel" href="#/transactions">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
        `
    },

    afterRender: async () => {
        const formTransaction = document.querySelector('#add-transaction-form');
        let userID = auth.currentUser.uid;
        let fileUpload = document.getElementById("image-transaction");
        let currentTime = DateTimeConvert.convert();

        let key = 0;
        db.ref('transactions/' + userID + "/").limitToLast(1).once("value").then((snapshot) => {
            let val = snapshot.val();
            if (val == null || typeof val == "undefined") {
                return;
            }
            let lastKey = Number(Object.keys(val)[0]);
            if (lastKey != null && typeof lastKey != "undefined" && lastKey >= 0) {
                key = lastKey + 1;
            }
        })

        fileUpload.addEventListener('change', () => {
            let buttonFileInput = document.getElementById('button-input-file');
            if (buttonFileInput) {
                buttonFileInput.style.color = "green";
                buttonFileInput.style.border = "2px solid green";
                let spanPrevious = document.getElementById('file-name');
                let spanFileName = document.createElement('span');
                spanFileName.setAttribute('class', 'js-fileName');
                spanFileName.setAttribute('id', 'file-name');
                spanFileName.innerHTML = fileUpload.files[0].name;
                spanPrevious.replaceWith(spanFileName);
            }
        })

        formTransaction.addEventListener('submit', e => {
            e.preventDefault();

            let files = fileUpload.files;
            if (files.length == 0) {
                alert("Picture was not selected. Default picture will be used instead.");
                let downloadURL = "https://www.shareicon.net/data/512x512/2015/11/20/675119_sign_512x512.png";
                AddTransaction.sendFormData(formTransaction, downloadURL, userID, key);
                return false;
            }

            var storageRef = storage.ref().child("images/" + userID + "/" + currentTime);
            let uploadTask = storageRef.put(files[0]);
            uploadTask.on('state_changed', function () {
                uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                    console.log('File available at ', downloadURL);
                    AddTransaction.sendFormData(formTransaction, downloadURL, userID, key);
                })
            })
        });
    },

    sendFormData: (formTransaction, downloadURL, userID, key) => {
        DatabaseUtils.writeTransactionData(AddTransaction.getFormData(formTransaction), downloadURL, userID, key);
        window.location.hash = "#/transactions";
    },

    getFormData: (formTransaction) => {
        return {
            description: formTransaction['description-transaction'].value,
            amount: formTransaction['amount-transaction'].value,
            type: formTransaction['type-transaction'].value,
            currency: formTransaction['currency-transaction'].value,
            category: formTransaction['category-transaction'].value,
            date: formTransaction['date-transaction'].value,
            account: formTransaction['account-transaction'].value,
            place: formTransaction['place-transaction'].value
        }
    },

    renderAside: () => {
        if (AddTransaction.dataStatistics == null) {
            return `
            <aside>
            <h2>Short statistics</h2>
                ${ShortStatisticsPartial.render([{ type: "Income", amount: "0", currency: "USD" }, { type: "Expense", amount: "0", currency: "USD" }])}
            </aside>

            `
        }
        return `
        <aside>
            <h2>Short statistics</h2>
                ${ShortStatisticsPartial.render(AddTransaction.dataStatistics)}
        </aside>
        `
    },
};

export default AddTransaction;