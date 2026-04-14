import { useState, useRef } from "react";

export default function useTimerEngine(onFinish){

  const [running,setRunning] = useState(false)
  const [seconds,setSeconds] = useState(1500)

  const timerRef = useRef(null)
  const sessionRef = useRef(null)

  const start = (duration,mode,taskId) => {

    sessionRef.current = {
      mode,
      taskId,
      start:new Date()
    }

    setSeconds(duration*60)
    setRunning(true)

    timerRef.current = setInterval(()=>{

      setSeconds(prev => {

        if(prev <= 1){
          clearInterval(timerRef.current)
          finish()
          return 0
        }

        return prev-1
      })

    },1000)
  }

  const finish = () => {

    const session = sessionRef.current

    if(!session) return

    onFinish(session)

    sessionRef.current = null
    setRunning(false)
  }

  return {
    running,
    seconds,
    start
  }

}