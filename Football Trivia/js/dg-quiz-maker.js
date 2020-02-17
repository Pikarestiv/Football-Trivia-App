if(!window.DG) {
	window.DG = {};
};

DG.QuizMaker = new Class( {
	Extends : Events,

	validEvents : ['start','sendanswer', 'correctanswer','wronganswer', 'finish','missinganswer','wrongAnswer'],

	config: {
		seconds: null,
		forceAnswer : false
	},

	html : {
		el : null
	},

	internal : {
		questionIndex : 0,
		questions : null,
		labelAnswerButton : 'Answer'
	},

	user : {
		answers : []
	},

	forceCorrectAnswer:false,

	initialize : function(config) {
		if(config.el) {
			this.html.el = config.el;
		}
		if(config.forceAnswer) {
			this.config.forceAnswer = config.forceAnswer;
		}
		if(config.forceCorrectAnswer !== undefined)this.forceCorrectAnswer = config.forceCorrectAnswer;
		if(config.labelAnswerButton) {
			this.internal.labelAnswerButton = config.labelAnswerButton;
		}

		this.internal.questions = config.questions;

		if(config.listeners) {
			for(var listener in config.listeners) {
				if(this.validEvents.indexOf(listener)>=0) {
					this.addEvent(listener, config.listeners[listener]);
				}
			}
		}
	},


//How the quiz is displayed

	_displayQuestion : function() {
		this._clearEl();
		this._addQuestionElement();
		this._addAnsweringOptions();
		this._addAnswerButton();
	},



	_addQuestionElement : function() {
		var el = new Element('div');
		el.addClass('dg-question-label');
		el.set('html', this._getCurrentQuestion().label);
		document.id(this.html.el).adopt(el);
	},




//js coding for the options
 
	_addAnsweringOptions : function() {
		var currentQuestion = this._getCurrentQuestion();
		var options = currentQuestion.options;
		var isMulti = currentQuestion.answer.length > 1;

		for(var i=0;i<options.length;i++) {
			var el = new Element('div');
			el.addClass('dg-question-option');

			var option = options[i];
			var id = 'dg-quiz-option-' + this.internal.questionIndex + '-' + i;

			var checkbox = new Element('input', {
				name : 'dg-quiz-options',
				id : id,
				type : isMulti ? 'checkbox' : 'radio',
				value : option
			});

			el.adopt(checkbox);

			var label = new Element('label', { 'for' : id, 'html' : option });
			el.adopt(label);

			document.id(this.html.el).adopt(el);
		}
	},

	_addAnswerButton : function() {
		var el = new Element('div');
		el.addClass('dg-answer-button-container');

		var button = new Element('input');
		button.type = 'button';
		button.set('value', this.internal.labelAnswerButton);
		button.addEvent('click', this._sendAnswer.bind(this));
		el.adopt(button);

		document.id(this.html.el).adopt(el);
	},

	_sendAnswer : function() {
		var answer = this._getAnswersFromForm();

		this.fireEvent('sendanswer', this)
		var currentQuestion = this._getCurrentQuestion();
		if((this.config.forceAnswer || currentQuestion.forceAnswer) && answer.length == 0) {
			this.fireEvent('missinganswer', this);
			return false;
		}

		this.user.answers[this.internal.questionIndex] = answer;

		if(!this._hasAnsweredCorrectly(this.internal.questionIndex) && (this.forceCorrectAnswer || currentQuestion['forceCorrectAnswer'])){
			this.fireEvent('wrongAnswer', this);
			return false;
		}


		this.internal.questionIndex++;

		//maxQ is the number of questn to be asked
		if (this.internal.questionIndex == maxQ) {
			this._clearEl();
			this.fireEvent('finish');
		}
		else {
			this._displayQuestion();
		}
	},

	_getAnswersFromForm : function() {
		var ret = [];
		var els = document.id(this.html.el).getElements('input');
		for(var i=0;i<els.length;i++) {
			if(els[i].checked) {
				ret.push( {
					index : i,
					answer : els[i].value

				});
			}
		}
		return ret;
	},

	_clearEl : function () {
		document.id(this.html.el).set('html','');
	},

	_getCurrentQuestion : function() {
		return this.internal.questions[this.internal.questionIndex];
	},

	start : function() {
		this._displayQuestion();

	},

	//the maxQ is the no. of questions to be asked
	getScore : function() {
		var ret = {
			numCorrectAnswers : 0,
			numQuestions : maxQ,
			percentageCorrectAnswers : 0,
			incorrectAnswers : []
		};

		//the 10 is the no. of questions to be asked
		var numCorrectAnswers = 0;
		for(var i=0;i<maxQ; i++) {
			if(this._hasAnsweredCorrectly(i)) {
				numCorrectAnswers++;
			}else{
				ret.incorrectAnswers.push({
					questionNumber : i+1,
					label : this.internal.questions[i].label,
					correctAnswer : this._getTextualCorrectAnswer(i),
					userAnswer : this._getTextualUserAnswer(i)
				})
			}
		}

		//the maxQ is the no. of questn to be asked
		ret.numCorrectAnswers = numCorrectAnswers;
		ret.percentageCorrectAnswers = Math.round(numCorrectAnswers/maxQ*100);

		return ret;
	},
	_getTextualCorrectAnswer : function(questionIndex) {
		var ret = [];
		var question = this.internal.questions[questionIndex];
		for(var i=0;i<question.answer.length;i++) {
			var answer = question.answer[i];
			if(question.options.indexOf(answer) == -1) {
				answer = question.options[answer];
			}
			ret.push(answer);
		}
		return ret.join(', ');
	},

	_getTextualUserAnswer : function(questionIndex) {
		var ret = [];
		var userAnswer = this.user.answers[questionIndex];
		for(var i=0;i<userAnswer.length;i++) {
			ret.push(userAnswer[i].answer);
		}
		return ret.join(', ');
	},
	_hasAnsweredCorrectly : function(questionIndex) {
		var correctAnswer = this.internal.questions[questionIndex].answer;
		var answer = this.user.answers[questionIndex];

		if(answer.length == correctAnswer.length ) {
			for(var i=0;i<answer.length;i++) {
				if(correctAnswer.indexOf(answer[i].answer) == -1 &&  correctAnswer.indexOf(answer[i].index) == -1){
					return false;
				}
			}
			return true;
		}

		return false;
	}
});