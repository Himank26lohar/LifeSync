export const getHourFraction = (date)=>{
  return date.getHours() + date.getMinutes()/60
}

export const getDayIndex = ()=>{
  return (new Date().getDay()+6)%7
}