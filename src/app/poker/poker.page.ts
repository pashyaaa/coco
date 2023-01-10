import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { CreatePlayerComponent } from './create-player/create-player.component';
import { collectionData, Firestore, doc, setDoc, deleteDoc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { collection } from '@firebase/firestore';

@Component({
  selector: 'app-poker',
  templateUrl: './poker.page.html',
  styleUrls: ['./poker.page.scss'],
})
export class PokerPage implements OnInit {

  gameId:any;
  game:any;
  playerId:any;
  player:any;
  players = [];
  curRound:any = {};
  votes = [];
  curVote = -99;

  constructor(
    private route: ActivatedRoute,
    private dataService:DataService,
    private popoverController: PopoverController,
    private firestore:Firestore
  ) 
  { 

  }

  async ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('game_id')!;
    
    const getGame = onSnapshot(
      this.dataService.getGame(this.gameId), 
      (snapshot) => {
        this.game = snapshot.data();
        console.log(this.game)
        if(this.game.cur_round == undefined || this.game.cur_round == '')
        {
          this.dataService.addRound(this.gameId).then(
            async res => {
              this.curRound.id = res.id;
              console.log(res.id)
              await this.dataService.editGame(this.gameId, this.curRound.id)
            }
          )
        }
        else
        {
          this.curRound.id = this.game.cur_round;
        }

        console.log(this.curRound.id)

        const getRound = onSnapshot(
          this.dataService.getRound(this.gameId, this.curRound.id), 
          (snapshot) => {
            this.curRound = snapshot.data();
            this.curRound.id = snapshot.id;
            console.log(this.curRound)
    
            const getVotes = onSnapshot(
              this.dataService.getVotes(this.gameId, this.curRound.id), 
              (snapshot) => {
                this.votes = [];
                snapshot.forEach((doc) => {
                  const vote = doc.data();
                  vote.id = doc.id;
                  console.log(vote)
                  this.votes.push(vote);
                });
                this.selectedVote(this.playerId);
              },
              (error) => {
                // ...
              });
          });
      },
      (error) => {
        // ...
      });

    this.playerId = localStorage.getItem(this.gameId);
    if(this.playerId == null)
    {
      this.createPlayer(this.gameId);
    }else
    {
      this.player = (await this.dataService.getPlayer(this.gameId, this.playerId)).data();
      console.log(this.player)
      if(this.player == undefined){
        this.createPlayer(this.gameId);
      }
    }

    const getPlayers = onSnapshot(
      this.dataService.getPlayers(this.gameId), 
      (snapshot) => {
        this.players = [];
        snapshot.forEach((doc) => {
          const player = doc.data();
          player.id = doc.id;
          console.log(player)
          this.players.push(player);
        });
      },
      (error) => {
        // ...
      });
  }

  async createPlayer(gameId){
    const popover = await this.popoverController.create({
      component: CreatePlayerComponent,
      componentProps: {
        popoverController: this.popoverController,
        gameId: gameId,
        action: 0
      },
      translucent: true,
    });
    popover.onDidDismiss().then(
      async res=>{
        this.playerId = res.data.playerId;
        console.log(this.playerId)
        this.player = (await this.dataService.getPlayer(this.gameId, this.playerId)).data();
        console.log(this.player)
        this.selectedVote(this.playerId);
      }
    )
    return await popover.present();
  }

  async editPlayer(playerId){
    const popover = await this.popoverController.create({
      component: CreatePlayerComponent,
      componentProps: {
        popoverController: this.popoverController,
        gameId: this.gameId,
        playerId: playerId,
        action: 1
      },
      translucent: true,
    });
    popover.onDidDismiss().then(
      async res=>{
        this.playerId = res.data.playerId;
        console.log(this.playerId)
        this.player = (await this.dataService.getPlayer(this.gameId, this.playerId)).data();
        console.log(this.player)
      }
    )
    return await popover.present();
  }

  reveal(){
    this.dataService.editRound(this.gameId, this.curRound.id, true).then(
      res => {
        console.log(res)
      }
    )
  }

  reset(){
    this.curVote = -99;
    this.dataService.addRound(this.gameId).then(
      async res => {
        this.curRound.id = res.id;
        console.log(res.id)
        await this.dataService.editGame(this.gameId, this.curRound.id)
      }
    )
  }

  vote(vote:number){
    console.log(vote)
    console.log(this.curRound.id)
    console.log(this.playerId)
    this.curVote = vote;
    this.dataService.addVote(this.gameId, this.curRound.id, this.playerId, vote);
  }

  playerColor(player:any){
    if(player){
      if(this.isVoted(player.id)){
        return '#0099ff9d'
      }else{
        return '#f853539d'
      }
    }else{
      return '#ffffff'
    }
  }

  isVoted(id:any){
    let voted = false;
    this.votes.forEach(vote => {
      if(vote.id == id){
        voted = true
      }
    })
    return voted;
  }

  selectedVote(id:any){
    console.log(id)
    let sVote;
    this.votes.forEach(vote => {
      if(vote.id == id){
        sVote = vote.vote
      }
    })
    this.curVote = sVote;
    console.log(this.curVote)
  }

  getVote(id:any){
    let sVote;
    this.votes.forEach(vote => {
      if(vote.id == id){
        sVote = vote.vote
      }
    })
    return sVote;
  }

  getAverage() {
    let sum = 0;
    for (let i = 0; i < this.votes.length; ++i) {
        sum += this.votes[i].vote;
    }
    return sum / this.votes.length;
  }
}