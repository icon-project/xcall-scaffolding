package app;

import score.Address;
import score.Context;
import score.VarDB;
import score.annotation.EventLog;
import score.annotation.External;
import score.annotation.Optional;
import score.annotation.Payable;
// import scorex.util.HashMap;

import java.math.BigInteger;
// import java.util.Map;

public class HelloWorld {
    private final VarDB<String> destinationBtpAddress = Context.newVarDB("btpAddress", String.class);
    private final VarDB<Address> xcallContractAddress = Context.newVarDB("xcall", Address.class);

    // private static final String ROLLBACK_YES = "voteYesRollback";

    public HelloWorld() {
    }

    @Payable
    @External
    public void initialize(Address _sourceXCallContract, String _destinationBtpAddress) {
        this.destinationBtpAddress.set(_destinationBtpAddress);
        this.xcallContractAddress.set(_sourceXCallContract);
    }

    private BigInteger _sendCallMessage(byte[] _data, @Optional byte[] _rollback) {
        Address xcallSourceAddress = this.xcallContractAddress.get();
        String _to = this.destinationBtpAddress.get();
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
            // Setup any required logic to handle the rollback here
        } else {
            Context.revert("Unauthorized caller");
        }

        // The following event is raised to notify that a rollback message has been received
        RollbackDataReceived(_from, _data);
    }

    @EventLog
    public void RollbackDataReceived(String _from, byte[] _rollback) {}
}
