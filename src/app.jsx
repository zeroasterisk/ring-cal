// App component - represents the whole app
App = React.createClass({

  // This mixin makes the getMeteorData method work
  mixins: [ReactMeteorData],

  // Loads items from the Tasks collection and puts them on this.data.tasks
  getMeteorData() {
    return {
      currentUser: Meteor.user(),
      tasks: Tasks.find({}, {sort: {createdAt: -1}}).fetch()
    }
  },

  amILoggedIn() {
    return !!Meteor.userId();
  },

  renderAnon() {
    return (
      <div className="container">
        <header>
          <h1>Welcome to Ring-Cal</h1>
        </header>

        <div className="alt-accounts-log-in-buttons-dialog">
          <AccountStatus />
          <AccountForm showClose='true'/>
        </div>
      </div>
    );
  },

  renderUser() {
    return (
      <div className="container">
        <header>
          <h1>Hi {this.data.user.profile.name}</h1>


          <form className="new-task" onSubmit={this.handleSubmit} >
            <input
              type="text"
              ref="textInput"
              placeholder="Type to add new tasks" />
          </form>

        </header>
      </div>
    );
  },

  render() {
    if (this.amILoggedIn()) {
      return this.renderUser();
    }
    return this.renderAnon();
  }
});
