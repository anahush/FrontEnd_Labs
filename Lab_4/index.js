import AddGoal from './views/add_goal.js';
import AddPlan from './views/add_plan.js';
import AddTransaction from './views/add_transaction.js';
import EditGoal from './views/edit_goal.js';
import EditPlan from './views/edit_plan.js';
import EditTransaction from './views/edit_transaction.js';
import Goals from './views/goals.js';
import Login from './views/login.js';
import MainPage from './views/mainpage.js';
import Plans from './views/plans.js';
import Register from './views/register.js';
import Statistics from './views/statistics.js';
import Transactions from './views/transactions.js';
import Error404 from './views/error404.js';


import Utils from './services/utils.js';
import Navbar from './views/navbar.js';

const routes = {
    '/': MainPage,
    '/add_goal': AddGoal,
    '/edit_goal/:id': EditGoal,
    '/edit_plan/:id': EditPlan,
    '/edit_transaction/:id': EditTransaction,
    '/add_plan': AddPlan,
    '/add_transaction': AddTransaction,
    '/goals': Goals,
    '/login': Login,
    '/plans': Plans,
    '/statistics': Statistics,
    '/transactions': Transactions,
    '/register': Register
};

let uid = null;

const router = async () => {
    const all = [];

    const header = null || document.querySelector('header');
    const content = null || document.querySelector('div.site-content');

    let request = Utils.parseRequestURL();
    let parsedURL = (request.resource ? '/' + request.resource : '/') + (request.id ? '/:id' : '');
    let page = null;


    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            header.innerHTML = await Navbar.render();
            page = routes[parsedURL] ? routes[parsedURL] : Error404;
            uid = user.uid;
        } else {
            header.innerHTML = await Navbar.renderOnlyLogin();
            if (parsedURL == '/login' || parsedURL == '/register') {
                page = routes[parsedURL] ? routes[parsedURL] : Error404;
            } else {
                page = routes['/login'];
                window.location.hash = "#/login";
            }
        }
        await Navbar.afterRender();

        if (page == Plans) {
            Promise.all([
                db.ref('plans/' + uid).once('value'),
                db.ref('transactions/' + uid).once('value')
            ]).then(async (snapshots) => {
                let plansData = snapshots[0].val();
                let transactionsData = snapshots[1].val();

                if (transactionsData) {
                    transactionsData = Object.values(transactionsData);
                } else {
                    transactionsData = [{ type: "Income", amount: "0" }, { type: "Expense", amount: "0" }]
                }

                if (plansData) {
                    let keys = Object.keys(plansData);
                    for (let key of keys) {
                        plansData[key].key = key;
                    }
                    content.innerHTML = await page.render(Object.values(plansData), transactionsData);
                } else {
                    content.innerHTML = await page.render(null, transactionsData);
                }
                await page.afterRender();
            })
        } else if (page == Goals) {
            Promise.all([
                db.ref('goals/' + uid).once('value'),
                db.ref('transactions/' + uid).once('value')
            ]).then(async (snapshots) => {
                let goalsData = snapshots[0].val();
                let transactionsData = snapshots[1].val();
                if (transactionsData) {
                    transactionsData = Object.values(transactionsData);
                } else {
                    transactionsData = [{ type: "Income", amount: "0" }, { type: "Expense", amount: "0" }]
                }

                if (goalsData) {
                    let keys = Object.keys(goalsData);
                    for (let key of keys) {
                        goalsData[key].key = key;
                    }
                    content.innerHTML = await page.render(Object.values(goalsData), transactionsData);
                } else {
                    content.innerHTML = await page.render(null, transactionsData);
                }
                await page.afterRender();
            })
        } else if (page == AddPlan || page == AddTransaction || page == AddGoal || page == Statistics) {
            db.ref('transactions/' + uid).once('value').then(async (snapshot) => {
                let transactionsData = snapshot.val();
                if (transactionsData) {
                    content.innerHTML = await page.render(Object.values(transactionsData));
                } else {
                    content.innerHTML = await page.render(null);
                }
                await page.afterRender();
            })
        } else if (page == Transactions) {
            db.ref('transactions/' + uid).once('value').then(async (snapshot) => {
                let transactionsData = snapshot.val();
                if (transactionsData) {
                    let keys = Object.keys(transactionsData);
                    for (let key of keys) {
                        transactionsData[key].key = key;
                    }
                    content.innerHTML = await page.render(Object.values(transactionsData));
                } else {
                    content.innerHTML = await page.render(null);
                }
                await page.afterRender();
            })
        } else if (page == MainPage) {
            Promise.all([
                db.ref('transactions/' + uid).once('value'),
                db.ref('goals/' + uid).once('value'),
                db.ref('plans/' + uid).once('value')
            ]).then(async (snapshots) => {
                let transactionsData = snapshots[0].val();
                let goalsData = snapshots[1].val();
                let plansData = snapshots[2].val();
                if (!transactionsData) {
                    transactionsData = null;
                } else {
                    transactionsData = Object.values(transactionsData);
                }
                if (!goalsData) {
                    goalsData = null;
                } else {
                    goalsData = Object.values(goalsData);
                }
                if (!plansData) {
                    plansData = null;
                } else {
                    plansData = Object.values(plansData);
                }
                content.innerHTML = await page.render(transactionsData, goalsData, plansData);
                await page.afterRender();
            });
        } else if (page == EditGoal) {
            let id = request.id.slice(1);
            Promise.all([
                db.ref('transactions/' + uid).once('value'),
                db.ref('goals/' + uid + '/' + id).once('value')
            ]).then(async (snapshots) => {
                content.innerHTML = await page.render(Object.values(snapshots[0].val()), snapshots[1].val(), id);
                await page.afterRender();
            })
        } else if (page == EditPlan) {
            let id = request.id.slice(1);
            Promise.all([
                db.ref('transactions/' + uid).once('value'),
                db.ref('plans/' + uid + '/' + id).once('value')
            ]).then(async (snapshots) => {
                content.innerHTML = await page.render(Object.values(snapshots[0].val()), snapshots[1].val(), id);
                await page.afterRender();
            })
        } else if (page == EditTransaction) {
            let id = request.id.slice(1);
            db.ref('transactions/' + uid).once('value').then(async (snapshot) => {
                let dataTransactions = snapshot.val();
                content.innerHTML = await page.render(Object.values(dataTransactions), dataTransactions[id], id);
                await page.afterRender();
            })
        } else {
            content.innerHTML = await page.render();
            await page.afterRender();
        }
    });

    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

window.addEventListener('hashchange', () => {
    router();
    hamburgerOnlyClose();
});
window.addEventListener('DOMContentLoaded', router);
auth.onAuthStateChanged(firebaseUser => {
    if (window.location.hash == "#/" && !firebaseUser) {
        router();
    }
})
