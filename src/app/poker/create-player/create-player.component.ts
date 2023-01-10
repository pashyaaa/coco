import { Component, Input, OnInit, Output } from '@angular/core';
import { addDoc, collection, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-create-player',
  templateUrl: './create-player.component.html',
  styleUrls: ['./create-player.component.scss'],
})
export class CreatePlayerComponent implements OnInit {

  @Input() popoverController: PopoverController;
  @Input() gameId: any;
  @Input() action: any;
  @Input() playerId: any;

  form: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private firestore: Firestore,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
    });
  }

  save(){
    const player = {
      name: this.form.get('name').value
    };
    const playersRef = collection(this.firestore, 'games/'+this.gameId+'/players');
    addDoc(playersRef, player).then(
      (player)=>{
        console.log(player.id);
        localStorage.setItem(this.gameId, player.id)
        this.popoverController.dismiss({playerId: player.id});
      }
    )
  }

  async edit(){
    const playerRef = doc(this.firestore, 'games/'+this.gameId+'/players/' + this.playerId );
    updateDoc(playerRef, {name:this.form.get('name').value}).then(
      (player)=>{
        this.popoverController.dismiss({playerId: this.playerId});
      }
    )
  }

}