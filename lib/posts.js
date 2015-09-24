Posts = new Mongo.Collection('posts');

//Posts.allow({
//    insert: function(userId, doc) {
//        return !! userId;
//    }
//});

Posts.allow({
    update: ownsDocument,
    remove: ownsDocument
});

Posts.deny({
    update: function(userId, post, fieldNames) {
        // разрешаем редактировать только следующие два поля:
        return (_.without(fieldNames, 'url', 'title').length > 0);
    }
});

Meteor.methods({
    post: function(postAttributes) {
        check(Meteor.userId(), String);
        check(postAttributes, {
            title: String,
            url: String
        });

        var postWithSameLink = Posts.findOne({url: postAttributes.url});
        if (postWithSameLink) {
            return {
                postExists: true,
                _id: postWithSameLink._id
            }
        }

        var user = Meteor.user();
        var post = _.extend(_.pick(postAttributes, 'url', 'message'), {
            title: postAttributes.title + (this.isSimulation ? ' (client)' : ' (server)'),
            userId: user._id,
            author: user.username,
            submitted: new Date()
        });

        // ждем 5 секунд
        if (! this.isSimulation) {
            var Future = Npm.require('fibers/future');
            var future = new Future();
            Meteor.setTimeout(function() {
                future.return();
            }, 5 * 1000);
            future.wait();
        }

        var postId = Posts.insert(post);

        return {
            _id: postId
        }
    }
});