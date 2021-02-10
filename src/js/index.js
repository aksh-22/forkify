import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Like';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as ListView from './views/ListView';
import * as LikesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {};

// SEARCH CONTROLLER

const controlSearch = async() => {
    // 1. get query from UI
    const query = searchView.getInput();

    if (query) {
        // 2. new search object and add to state obj.
        state.search = new Search(query);

        // 3. prepare UI for result
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes); //note

        try {
            // 4. search for recipe
            await state.search.getresult();

            // 5. render result on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('something went wrong with search');
            clearLoader();
        }
    }
};
//note
elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault(); // use this to stop reload the page on submit the button
    controlSearch();
});

elements.searchResPages.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-inline'); // use closest to get result by clicking nearby
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

//  RECIPE CONTROLLER

const controlRecipe = async() => {
    const id = window.location.hash.replace('#', ''); //note
    if (id) {
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        //create new recipe object
        state.recipe = new Recipe(id);
        try {
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients(); //note

            //calcute serving and time
            state.recipe.calcTime();
            state.recipe.calcServing();

            //render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id), //note
            );
        } catch (err) {
            alert('error in processing recipe!');
        }
    }
};

['hashchange', 'load'].forEach((event) =>   
    window.addEventListener(event, controlRecipe),
);
// window.addEventListener(--------); we use it when we use the diffrent events for same function

// List controller
const controlList = () => {
    // create new list if it isn't there
    if (!state.list) state.list = new List();

    // add each ingredient to list and ui
    state.recipe.ingredients.forEach((el) => {
        const item = state.list.addItems(el.count, el.unit, el.ingredient);
        ListView.renderItem(item);
    });
};

// Handling delete and update shopping list
elements.shopping.addEventListener('click', (e) => {
    //note
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);

        //delete from ui
        ListView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// Like Controller
// state.likes = new Likes();
// LikesView.toggleLikeMenu(state.likes.getNumLikes());
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // if not liked already
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );

        //toggle the like btn
        LikesView.toggleLikeBtn(true);

        // Add like to UI list
        LikesView.rendorLike(newLike);
    }

    // if like already
    else {
        //remove from state
        state.likes.deleteLike(currentID);

        //toggle the like btn
        LikesView.toggleLikeBtn(false);

        // Remove from UI
        LikesView.deleteLike(currentID);
    }
    LikesView.toggleLikeMenu(state.likes.getNumLikes());
};

// handling restoring data from storage
window.addEventListener('load', () => {
    state.likes = new Likes();
    // resring likes
    state.likes.restoreData();

    LikesView.toggleLikeMenu(state.likes.getNumLikes());
    // render existing likes
    state.likes.likes.forEach((like) => LikesView.rendorLike(like));
});

// Handling recipe button click

elements.recipe.addEventListener('click', (e) => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Incerase button is cliked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingedients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});