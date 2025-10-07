// app.js - Sample changes for test PR

function add(a, b) {
    return a + b;
}

// Added a new function subtract
function subtract(a, b) {
    if (a == null || b == null) return 0; // handle null inputs
    return a - b;
}

// Updated multiply function to log result
function multiply(a, b) {
    const result = a * b;
    console.log("Multiplication result:", result);
    return result;
}

console.log(add(2, 3));
console.log(subtract(10, 7));
console.log(multiply(4, 5));