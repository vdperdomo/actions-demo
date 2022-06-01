/* const singleton = new Actions();

const addNewCommentToList = () => {
    const newComment = document.createElement('li')
    newComment.innerHTML = '<p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. In magnam architecto, facere minima eius quod!</p>';
    const list = document.getElementById('comments');
    list.appendChild(newComment);
    console.log(list)
}


singleton.register('comments.add_more_comments', addNewCommentToList)


const clickAddMoreComments = () => {
    singleton.call('comments.add_more_comments')
}

 */

window.onload = () => {
    addTextAreaInitialContent();
    document.getElementById('add-more-comments-button').addEventListener('click', clickAddMoreComments)
    document.getElementById('clear-comments-button').addEventListener('click', clearComments)
}

const addTextAreaInitialContent = () => {

    const content = `

var actions = new Actions();

/* to 'trigger' the action use call method */

function clickAddMoreComments() {
   actions.call('comments.add_more_comments')
}

function clearComments() {
    actions.call('comments.clear_comments')
}



/* to register new actions use register method. These actions can be async */

actions.register('comments.clear_comments', () => {
    const comments = document.getElementById('comments')
    comments.innerHTML = '';
});

actions.register('comments.add_more_comments', () => {
    const newComment = document.createElement('li')
    newComment.innerHTML = '<p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. In magnam architecto, facere minima eius quod!</p>';
    const list = document.getElementById('comments');
    list.appendChild(newComment);
});



/* to register new interceptor use intercept method */

var testInterceptor = async (context) => {
    console.log('call');
    setTimeout(()=>{
        console.log("intercepted ", context.action_name);
        context.continue();
        context.continue(); // intentional second call to prove nothing odd happens
    }, 1000);
};
actions.intercept("comments.add_more_comments", testInterceptor);

`
    var el = document.getElementById('scriptContent');
    el.innerHTML = content;

    run();
}


function run() {
    var oldScript = document.getElementById('scriptContainer');
    if (oldScript) {
        oldScript.parentNode.removeChild(oldScript);
    }

    var el = document.getElementById('scriptContent');
    
    var newScript;
    newScript = document.createElement('script');
    newScript.id = 'scriptContainer';
    newScript.text = el.value;
    document.body.appendChild(newScript);
} 




