package app;

import score.Address;
import score.Context;
import score.VarDB;
import score.annotation.EventLog;
import score.annotation.External;
import score.annotation.Optional;
import score.annotation.Payable;

import java.math.BigInteger;

public class HelloWorld {
    private final VarDB<String> destinationAddress = Context.newVarDB("btpAddress", String.class);
    private final VarDB<Address> xcallContractAddress = Context.newVarDB("xcall", Address.class);

    private static final String ROLLBACK = "ExecuteRollback";

    private final VarDB<String> rollback = Context.newVarDB("rollback", String.class);

    public HelloWorld() {
        this.rollback.set(ROLLBACK);
    }

    @Payable
    @External
    public void initialize(Address _sourceXCallContract, String _destinationAddress) {
        this.destinationAddress.set(_destinationAddress);
        this.xcallContractAddress.set(_sourceXCallContract);
    }

    private BigInteger _sendCallMessage(byte[] _data, @Optional byte[] _rollback) {
        Address xcallSourceAddress = this.xcallContractAddress.get();
        String _to = this.destinationAddress.get();
        return Context.call(BigInteger.class, Context.getValue(), xcallSourceAddress, "sendCallMessage", _to, _data, _rollback);
    }

    @Payable
    @External
    public void sendMessage(byte[] payload, @Optional byte [] rollback) {

        BigInteger id = _sendCallMessage(payload, rollback);
        Context.println("sendCallMessage Response:" + id);
    }

    @Payable
    @External
    public void handleCallMessage(String _from, byte[] _data) {
        Address caller = Context.getCaller();
        String payload = new String(_data);
        Address xcallSourceAddress = this.xcallContractAddress.get();
        Context.println("handleCallMessage payload:" + payload);
        // If the caller is the xcall contract, then update the local count
        if (caller.equals(xcallSourceAddress)) {
            Context.println("Message received");
            // The following event is raised to notify that a message has been received
           MessageReceived(_from, _data);
           if (payload.equals(this.rollback.get())) {
                // Setup any required logic to handle the rollback here
               Context.println("Rollback message received");
                // The following event is raised to notify that a rollback message has been received
                RollbackDataReceived(_from, _data);
           }
        } else {
            Context.revert("Unauthorized caller");
        }

    }

    @EventLog
    public void MessageReceived(String _from, byte[] _msgData) {}

    @EventLog
    public void RollbackDataReceived(String _from, byte[] _rollback) {}
}
