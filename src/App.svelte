<script>
	import { fade, fly } from "svelte/transition";
	import { onMount } from 'svelte';
	import Button from './Button.svelte'
	let visible = false;

	onMount(()=> (visible =true));
	document.onkeypress = function (event) {
		visible = false;
	}


	function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}





	function timeout(delay) {
    	return new Promise( res => setTimeout(res, delay) );
	}

	
	let addMove = 0;
	let subtractMove = 0;
	let multiplyMove = 0;
	let divideMove = 0;
	let start = 0;
	let final = 0;
	let number = final;
	let multiplytries = 0;


	let level = 1;
	let ogmoves = 4; 
	let goal = start;
	let movesLeft = ogmoves;


	function generateLevel(){
		number = 0;
		start = 0;
		final = 0;
		movesLeft = ogmoves;
		start = Math.floor(Math.random()*18)+2;
		final = start;
		var arr = [0,1,2,3];
		shuffle(arr);
		for (let i = 0; i < arr.length; i++) {
			if(arr[i]==0){
				addMove=Math.floor(Math.random()*30)+1;
				final-=addMove;
			}
			if(arr[i]==1){
				subtractMove=Math.floor(Math.random()*30)+1;
				final+=subtractMove;
			}
			if(arr[i]==2){
				multiplyMove=Math.floor(Math.random()*9)+2;
				while(final%multiplyMove!=0 && multiplytries <= 35){
					multiplyMove=Math.floor(Math.random()*9)+2;
					multiplytries++;
				}
				if(multiplytries>=35){
					generateLevel();
				}
				
				final/=multiplyMove;
			}
			if(arr[i]==3){
				divideMove=Math.floor(Math.random()*9)+2;
				final*=divideMove;
			}
		}
		if(start==final){
			generateLevel();
		}
		if(multiplyMove==divideMove){
			generateLevel();
		}
		if(addMove==subtractMove){
			generateLevel();
		}
		number = final;
		movesLeft = ogmoves;
		goal = start;
	}
	generateLevel();



	function reset() {
		if(number!="SUCCESS"){
			number = final;
			movesLeft = ogmoves;
			goal = start;
		}
		else{
			generateLevel();
		}
		if(goal==number){
			generateLevel();
		}
		
	}


	function multiply(factor){
		if(movesLeft>0){
			console.log(number*=factor);
			movesLeft--;
		}
		if(number==goal){
			level++;
			movesLeft=0;
			number = "SUCCESS";
			setTimeout(() => { generateLevel(); }, 2000);
		}
	}
	function add(amount){
		if(movesLeft>0){
			console.log(number+=amount);
			movesLeft--;
			
		}
		if(number==goal){
			level++;
			movesLeft=0;
			number = "SUCCESS";
			setTimeout(() => { generateLevel(); }, 2000);
		}
	}
	function subtract(amount){
		if(movesLeft>0){
			console.log(number-=amount);
			movesLeft--;
		}
		if(number==goal){
			level++;
			movesLeft=0;
			number = "SUCCESS";
			setTimeout(() => { generateLevel(); }, 2000);
		}
	}
	function divide(factor){
		if(movesLeft>0){
			if(number%factor==0){
				console.log(number/=factor);
				movesLeft--;
			}
			else{
				number = "ERROR";
				movesLeft=0;
			}
			
		}
		if(number==goal){
			level++;
			movesLeft=0;
			number = "SUCCESS";
			setTimeout(() => { generateLevel(); }, 2000);
		}
	}
	//document.getElementById("level").textContent="Level: 2";

</script>

<main>
	<title>Calculator Game</title>
	{#if visible}
	<h1 transition:fade={{duration: 1500}}>Calculator Game</h1>
	<p id="titleInstruct" transition:fade={{delay: 250,duration: 1500}}> Press Any Button To Start...</p>
	{/if}
	
</main>
<body>
	{#if !visible}
	<div class="calculator" in:fade={{delay: 1750, duration: 1000}}>
		<div class="display-box">
			<h2 id="level">Level: {level}</h2>
			<p id="moves">Moves Left: {movesLeft}</p>
			<p id="goal">Goal: {goal}</p>
			<p id="number">{number}</p>
		</div>
		<div class="buttons" >
			<div class="col1">
				<div class="button">
					<Button></Button>
				</div>
				<div class="button" id="times2" on:click={() => add(addMove)}>
					<Button>+{addMove}</Button>
				</div>
				<div class="button">
					<Button></Button>
				</div>
			</div>
			
			<div class="col2">
				<div class="button" on:click={() => multiply(multiplyMove)}> 
					<Button>X{multiplyMove}</Button>
				</div>
				<div class="button" id="reset" on:click={reset}>
					<Button bgColor='255, 0, 0' rippleColor='165, 0, 0'>Reset</Button>
				</div>
				<div class="button" on:click={() => divide(divideMove)}>
					<Button>/{divideMove}</Button>
				</div>
			</div>
			<div class="col3">
				<div class="button">
					<Button></Button>
				</div>
				<div class="button"  on:click={() => subtract(subtractMove)}>
					<Button>-{subtractMove}</Button>
				</div>
				<div class="button">
					<Button></Button>
				</div>
			</div>
		</div>
	</div>
	<div class="instructions" in:fade={{delay: 1750, duration: 1000}}>
		<!--<h3 id="instructTitle">How to play</h3>
		<p id="instructText">Welcome to Calculator Game! You are given a starting number and must use the provided operators to reach the goal number. But be careful! You only have a certain number of moves. Press the Reset button to reset the level.</p> -->
	</div>
	{/if}
</body>
<style>
	@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

	:global(body) {
		background-color: #f2ecbd;
	}

	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		position: absolute;
		left: 50%;
		top: 30%;
		transform: translate(-50%,-50%);
		color: black;
		text-transform: uppercase;
		font-size: 7em;
		font-weight: 100;
		font-family: 'VT323', monospace;
		font-style: italic;
		max-width: 100em;
		z-index: 2;
	}

	#titleInstruct {
		position: absolute;
		font-size: 2.5em;
		left: 50%;
		top: 50%;
		transform: translate(-50%,-50%);
		font-family: 'VT323', monospace;
		z-index: 2;
	}

	#moves {
		position: absolute;
		top: 0px;
		right: 50px;
		font-size: 25px;
	}

	
	#level {
		position: absolute;
		font-size: 40px;
		left: 40px;
		top: -15px;
	}
	
	#goal {
		position: absolute;
		top: 30px;
		right: 50px;
		font-size: 25px;
	}

	#number {
		position: absolute;
		font-size: 100px;
		right: 80px;
		top: -10px;  
		font-style: bold;
	}

	.calculator {
    padding: 10px;
    border-radius: 1em;
    height: 725px;
    width: 500px;
    background-color: #191b28;
    box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
	}

	.display-box {
    font-family: 'VT323', sans-serif;
    background-color: #dcdbe1;
    color: black;
    border-radius: 5px;
    width: 93%;
	margin: auto;
    height: 27%;
	}

	.buttons {
		display: flex;
		padding-left: 10px;
		padding-top: 13px;
		
	}

	.button {
		border: 5px solid #191b28;
	}

	


</style>