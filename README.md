# Reflow 

Reflow is a very basic workflow helper, it takes a state getter/setter function and a workflow definition, 
and returns a transition function which will transition an object between states, following the rules of the 
workflow and calling any workflow state transition logic provided.


## Contrived Example:


```javascript
var reflow = require("reflow");

//Define a function that knows how to get the current state from your object type
function getState(o, callback) { 
    callback(null, o.state); 
};

// Define a function that knows how to set the state for your object type.
function setState(o, state, callback) { 
    o.state = state; 
    callback(null, o);
};

// Define a workflow, this one has 3 states, start, middle, end. Each state
// may transition to the next, and then the workflow loops around to the start.

var workflow = {
    start : {
        middle : {}
    }, 

    middle : {
        end : {}
    },

    end : {
        start : {}
    }
    
};

//Create a transition function from getter, setter and workflow
var transition = reflow(getState, setState, workflow);

//Create an object with a state
var obj = { state : 'start' };

//transition our object from start to middle
transition(obj, 'middle', function(err, obj) {
    if(err) console.log(err);
    console.log("New state is:", obj.state);
});

```

## Defining workflows

Workflows are simply a double-nested javascript object with the first 
tier defining states, and the second defining transitions.

Each state defines allowed target states (transitions), which
can have conditions and triggers. Conditions and triggers are functions 
which are invoked before the transition to check it is allowed, or after 
to perform some activity on transition.

### Condition functions 

Condition functions take the object, target state and a callback which should
be invoked with an error, and a boolean value, to allow or block transition.

```javascript
function myCondition(obj, newState, callback) {
    if(obj.someCondition) {
        return callback(null, true); // allow the transition
    } else {
        return callback(null, false); // disallow the transition
    }
});
```

### Trigger functions 

Trigger functions take the object and a callback, and perform any side-effect
of the transition. 

```javascript
function myCondition(obj, callback) {
    //Do something after the transition
    return callback(null);  
    }
});
```

## A more involved workflow with triggers and conditions

```javascript
var orderWorkflow = {
    received : {
        assembly : {
            conditions : [ checkStock, checkBacklog ],
            triggers : [ sendAssemblyTicket ]
        }
    }, 

    assembly : {
        received : {
            triggers : [ notifyAccountsRejected ]
        },
        shipping : {
            conditions : [ checkBuild ],
            triggers : [ notifyAccountsBuildComplete ]
        }
    },

    shipping : {
        received : {
            trigger : [ notifyAccountsReceived ]
        }
    },

    received : {}
};
```
