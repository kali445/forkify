import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the application
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked Recipe
 */
const state = {};
window.state = state;

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
  // 1. Get query from view
  const query = searchView.getInput();
  console.log(query);

  if (query) {
    // 2. New Search object and add to state
    state.search = new Search(query);

    // 3. Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    // 4. Search for recipes
    await state.search.getResults();

    // 5. Render results on the UI
    clearLoader();
    searchView.renderResults(state.search.result);
  }
};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
  // 1. Get ID from the url
  const id = window.location.hash.replace('#', '');
  console.log(id);

  if (id) {
    // 2. Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // 3. Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // 3. Create new Recipe object
    state.recipe = new Recipe(id);

    try {
      // 4. Get recipe data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // 5. Calculate time and servings
      state.recipe.calcTime();
      state.recipe.calcServings();

      // 6. Render Recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
    }
  }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/**
 * LIST CONTROLLER
 */
const controlList = () => {
  // Create a new list if there is none yet
  if (!state.list) state.list = new List();

  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle Update and delete list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Handle the delete
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);
  } else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/**
 * LIKE CONTROLLER
 */

state.likes = new Likes(); //TESTING
likesView.toggleLikeMenu(state.likes.getNumLikes()); // TESTING

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();

  const currentID = state.recipe.id;

  // User has NOT liked the current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // Toggle the like button
    likesView.toggleLikeBtn(true);

    // Add like to the UI list
    likesView.renderLike(newLike);
  } else {
    // Remove like to the state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikeBtn(false);

    // Remove like to the UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease btn is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  }

  if (e.target.matches('.btn-increase, .btn-increase *')) {
    // Increase btn is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Like Controller
    controlLike();
  }
});

window.l = new List();
