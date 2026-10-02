import {StateStore} from '../lib/store.mjs';
const [root,id]=process.argv.slice(2),requirementId=`REQ-${id}`,store=new StateStore(root);
for(let attempt=1;attempt<=3;attempt++){
  try{
    store.transaction(state=>{if(!state.requirements.some(item=>item.id===requirementId))state.requirements.push({id:requirementId,text:`writer ${id}`,criteria:[]})},{timeoutMs:180000});
    break;
  }catch(error){if(error?.code!=='LOCK_TIMEOUT'||attempt===3)throw error}
}
