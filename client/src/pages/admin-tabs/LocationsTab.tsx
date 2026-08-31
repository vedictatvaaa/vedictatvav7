import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

type City = { id:number; stateId:number; name:string; slug:string; isActive:boolean; panditCount?:number; reviewCount?:number };
type State = { id:number; name:string; code:string; isActive:boolean; cities:City[]; panditCount?:number; reviewCount?:number };
export default function LocationsTab({ adminToken }: { adminToken?: string }) {
  const fetcher = createFetcher(adminToken); const qc = useQueryClient(); const { toast } = useToast();
  const [stateId, setStateId] = useState(""); const [name, setName] = useState(""); const [editing, setEditing] = useState<City | null>(null);
  const { data: states = [] } = useQuery<State[]>({ queryKey:["/api/admin/locations"], queryFn:()=>fetcher("/api/admin/locations") });
  const selected = states.find(s => String(s.id) === stateId);
  const request = async (url:string, method:string, body?:unknown) => { const r=await fetch(url,{method,headers:{"Content-Type":"application/json","x-admin-token":adminToken||""},body:body?JSON.stringify(body):undefined}); const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||"Location update failed"); return d; };
  const mutation = useMutation({ mutationFn: ({url,method,body}:{url:string;method:string;body?:unknown})=>request(url,method,body), onSuccess:()=>{qc.invalidateQueries({queryKey:["/api/admin/locations"]}); qc.invalidateQueries({queryKey:["/api/locations"]}); toast({title:"Locations updated"});}, onError:(e:Error)=>toast({title:"Update failed",description:e.message,variant:"destructive"}) });
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-serif text-primary">Locations</h1><p className="text-sm text-muted-foreground">Manage standardized states and cities. Locations with dependencies are never deleted.</p></div>
    <Card><CardContent className="p-4 grid gap-3 md:grid-cols-2">{states.map(s=><div key={s.id} className="flex justify-between items-center border rounded p-3"><button onClick={()=>setStateId(String(s.id))} className="text-left"><b>{s.name}</b> <span className="text-xs text-muted-foreground">({s.code}) · {s.cities.length} cities · {s.panditCount||0} pandits</span></button><Button size="sm" variant="outline" onClick={()=>mutation.mutate({url:`/api/admin/locations/states/${s.id}`,method:"PATCH",body:{isActive:!s.isActive}})}>{s.isActive?"Deactivate":"Activate"}</Button></div>)}</CardContent></Card>
    {selected && <Card><CardContent className="p-5 space-y-4"><h2 className="font-serif text-xl text-primary">{selected.name} cities</h2>
      <div className="flex gap-2"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="New city name"/><Button disabled={!name.trim()} onClick={()=>{mutation.mutate({url:"/api/admin/locations/cities",method:"POST",body:{stateId:selected.id,name}});setName("");}}>Add city</Button></div>
      {selected.cities.map(c=><div key={c.id} className="flex flex-wrap gap-2 items-center border-t pt-3"><span className="flex-1 font-medium">{c.name} <small className="text-muted-foreground">· {c.panditCount||0} pandits · {c.reviewCount||0} reviews</small></span><Button size="sm" variant="outline" onClick={()=>setEditing(c)}>Edit</Button><Button size="sm" variant="outline" onClick={()=>mutation.mutate({url:`/api/admin/locations/cities/${c.id}`,method:"PATCH",body:{isActive:!c.isActive}})}>{c.isActive?"Deactivate":"Activate"}</Button></div>)}
      {editing && <div className="border rounded p-3 grid gap-2 md:grid-cols-3"><Input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/><Select value={String(editing.stateId)} onValueChange={v=>setEditing({...editing,stateId:Number(v)})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{states.map(s=><SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select><Button onClick={()=>{mutation.mutate({url:`/api/admin/locations/cities/${editing.id}`,method:"PATCH",body:{name:editing.name,stateId:editing.stateId}});setEditing(null)}}>Save city</Button></div>}
    </CardContent></Card>}
  </div>;
}