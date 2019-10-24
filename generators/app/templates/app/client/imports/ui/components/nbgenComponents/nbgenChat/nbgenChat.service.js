/**
 * This is a chatbot service using DialogFlow
 */
import angular from 'angular';
import _ from 'underscore';
import chatTemplate from './chatDialogTemplate.html';

const moduleName = 'NbgenChat';
export default moduleName;

const serviceName = '$nbgenChat'

class NbgenChatService {
    constructor($Meteor, $Mongo, $mdPanel, $mdDialog, $tmvUiUtils, $reactive, $rootScope) {
        'ngInject';

        this.$Meteor = $Meteor;
        this.$Mongo = $Mongo;
        this.$mdPanel = $mdPanel;
        this.$mdDialog = $mdDialog;
        this.$tmvUiUtils = $tmvUiUtils;
        $reactive(this).attach($rootScope);

        this._initChatsAndMessages();
    }

    retrieveChatId() {
        return new Promise((resolve, reject) => {
            if (this.currentChatId) {
                // there's already a chat session
                resolve(this.currentChatId);
            } else {
                this.call('chats.insert', (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.currentChatId = result;
                        resolve(result);
                    }
                })
            }
        })
    }

    // display the chat panel
    showChatPanel(ev) {
        this.retrieveChatId().then(() => {
            let panelPosition, panelAnimation;
            let mainCtrl = this;
            let targetElement = ev.currentTarget;

            panelPosition = this.$mdPanel.newPanelPosition()
                .relativeTo(targetElement)
                .addPanelPosition(
                    this.$mdPanel.xPosition.ALIGN_END,
                    this.$mdPanel.yPosition.BELOW,
                )

            panelAnimation = this.$mdPanel.newPanelAnimation()
                .openFrom(targetElement)
                .closeTo(targetElement)
                .withAnimation(this.$mdPanel.animation.SCALE)

            let config = {
                attachTo: angular.element(document.body),
                controller: ChatDialogController,
                controllerAs: 'chat',
                position: panelPosition,
                animation: panelAnimation,
                targetEvent: ev,
                template: chatTemplate,
                clickOutsideToClose: true,
                escapeToClose: true,
                focusOnOpen: true,
                bindToController: true,
                hasBackdrop: true,
                locals: {
                    mainCtrl,
                }
            }
    
            this.$mdPanel.open(config);
        }, (err) => {
            this.$tmvUiUtils.error(err);
        })
        
    }

    _initChatsAndMessages() {
        this.chatsCollection = this.$Mongo.Collection.get('chats') || new this.$Mongo.Collection('chats');
        this.messagesCollection = this.$Mongo.Collection.get('messages') || new this.$Mongo.Collection('messages');

        this.subscribe('chats', () => [{_id: this.getReactively('currentChatId')}])
        this.subscribe('messages', () => [{chatId: this.getReactively('currentChatId')}]);
        this.helpers({
            currentChat() {
                return this.chatsCollection.findOne({_id: this.getReactively('currentChatId')});
            },
            currentMessages() {
                return this.messagesCollection.find({chatId: this.getReactively('currentChatId')});
            }
        })
    }
}

/**
* This is for chat dialog
*/
class ChatDialogController {
    constructor($scope, $reactive, $element, $timeout, mainCtrl, mdPanelRef, $tmvUiUtils) {
        'ngInject';

        this.$scope = $scope;
        this.mainCtrl = mainCtrl;
        this.$element = $element;
        this.$timeout = $timeout;
        this.mdPanelRef = mdPanelRef;
        this.$tmvUiUtils = $tmvUiUtils
        $reactive(this).attach($scope);

        this.waitingForReply = false;
    }

    $onInit() {
        this.$timeout(() => this._updateScroll());
    }

    _updateScroll() {
        let elem = this.$element.find('.chat-content');
        if (elem.length > 0) {
            elem = elem[0];
            elem.scrollTop = elem.scrollHeight;
        }
    }

    sendMessage(message) {
        if (!_.isEmpty(message)) {
            this.waitingForReply = true;
            this.call('messages.insert', message, this.mainCtrl.currentChatId, (err, resp) => { // eslint-disable-line
                if (err) {
                    this.$tmvUiUtils.error(err);
                } else {
                    // console.log(resp)
                }
                this.waitingForReply = false;
                this.$timeout(() => this._updateScroll());
            })
        }
        
        this.inputChat = null;
    }
}


angular.module(moduleName, [])
    .service(serviceName, NbgenChatService)
    .directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown", function(e) {
                if(e.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'e': e});
                    });
                    e.preventDefault();
                }
            });
        };
    });